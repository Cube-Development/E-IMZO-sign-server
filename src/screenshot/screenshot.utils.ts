import axios from "axios";
import fs from "fs";
import path from "path";
import { chromium, Page } from "playwright";
import { log } from "../utils";
import { IErrorCallback, IPostCapture } from "../type";
import { TEST_SCREENSHOTS } from "../config";

const TEST_SCREENS_DIR = path.join("src", "tests", "screenshots", "screens");

if (TEST_SCREENSHOTS && !fs.existsSync(TEST_SCREENS_DIR)) {
  fs.mkdirSync(TEST_SCREENS_DIR, { recursive: true });
}

export async function uploadScreenshot(url: string, bytes: Buffer) {
  await axios.put(url, bytes, {
    headers: { "Content-Type": "image/png" },
  });
}

export function buildWebHrefFromTgaddr(tgaddr: string) {
  if (!tgaddr) return null;
  if (/tg%3A|%3A/.test(tgaddr)) {
    if (tgaddr.startsWith("https://")) return tgaddr;
    return "https://web.telegram.org/k/#?tgaddr=" + tgaddr.split("tgaddr=")[1];
  }
  const raw = tgaddr.startsWith("tg://") ? tgaddr : tgaddr;
  return "https://web.telegram.org/k/#?tgaddr=" + encodeURIComponent(raw);
}

/**
 * Пробует создать прямую ссылку на Telegram Web K минуя t.me
 * Работает для ссылок вида t.me/channel/id
 */
function tryResolveDirectTelegramKLink(link: string): string | null {
  const match = link.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)/);
  if (match) {
    const channel = match[1];
    const postId = match[2];
    const tgaddr = `tg://resolve?domain=${channel}&post=${postId}`;
    return `https://web.telegram.org/k/#?tgaddr=${encodeURIComponent(tgaddr)}`;
  }
  return null;
}

/**
 * Проверяет наличие auth.json.
 * В production не блокирует stdin — при отсутствии файла бросает ошибку.
 */
export async function ensureAuth(auth_path: string) {
  if (fs.existsSync(auth_path)) return;
  throw new Error(`Файл авторизации ${auth_path} не найден. Запустите 'npm run auth' для создания.`);
}

export async function closeModalIfExists(page: Page) {
  try {
    const modal = await page.$("div.Modal.error.shown.open");
    if (modal) {
      const btn = await modal.$("button, div[role='button']");
      if (btn) {
        console.log("Закрываю модальное окно...");
        await btn.click().catch(() => null);
        await page.waitForTimeout(1000);
      }
    }
  } catch {}
}

export async function handleTelegramLink(page: Page, link: string): Promise<Buffer> {
  let target = tryResolveDirectTelegramKLink(link);

  if (target) {
    log.info(`[FastPath] Прямая ссылка сформирована: ${target}`);
  } else {
    log.info(`[SlowPath] Захожу на t.me для разрешения ссылки: ${link}`);
    await page.goto(link, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);

    const btn = await page.$("a.tgme_action_web_button, a.tgme_action_button_new, a.tgme_action_button");
    if (!btn) {
      log.warn("Кнопка 'Open in Web' не найдена. Просто делаем скриншот.");
      await page.waitForTimeout(2000);
      const buffer = await page.screenshot({ fullPage: true });
      log.info("✅ Скриншот успешно сделан");
      return buffer;
    }

    const hrefAttr = await btn.getAttribute("href");
    if (hrefAttr) {
      if (hrefAttr.includes("web.telegram.org")) target = hrefAttr.replace('/a/', '/k/');
      else if (hrefAttr.includes("tgaddr") || hrefAttr.startsWith("tg://") || hrefAttr.includes("privatepost"))
        target = buildWebHrefFromTgaddr(hrefAttr);
      else if (hrefAttr.startsWith("/")) target = "https://t.me" + hrefAttr;
    }

    if (!target) {
      const html = await page.content();
      const m = html.match(/(tg(?:%3A|:)\/\/privatepost[^\"]+)/i) || html.match(/tgaddr=([^\"\&']+)/i);
      if (m) {
        const found = m[1] ?? m[0];
        target = buildWebHrefFromTgaddr(found);
      }
    }
  }

  if (!target) throw new Error("Не удалось получить web.telegram.org ссылку.");

  log.info(`Перехожу на: ${target}`);
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => null);
  
  // Даем чуть-чуть времени на первичный редирект внутри SPA
  await page.waitForTimeout(1000);

  await closeModalIfExists(page);

  // Динамически ждем отрисовку контента сообщения
  log.info(`Ожидаю контент сообщения для ${link}...`);
  try {
    await page.waitForFunction(() => {
        const msg = document.querySelector('.Message, .message, .message-content, .bubble, .text-content') as HTMLElement;
        if (!msg) return false;
        
        const text = msg.innerText || "";
        // Исключаем пустые сообщения, сообщения только из спецсимволов и типичные загрузочные фразы
        const isNotLoading = text.length > 5 && !text.includes("Loading") && !text.includes("Загрузка");
        const hasHeight = msg.offsetHeight > 50; // Сообщение должно иметь физическую высоту
        
        return isNotLoading && hasHeight;
    }, { timeout: 35000 });
    
    // Даем время на отрисовку шрифтов, медиа и анимаций (особенно важно под нагрузкой)
    await page.waitForTimeout(2000); 

    // Извлекаем текст для логов (для отладки белых экранов)
    const foundText = await page.evaluate(() => {
        const msg = document.querySelector('.Message, .message, .message-content, .bubble, .text-content') as HTMLElement;
        return msg ? msg.innerText : "";
    });
    log.info(`✅ Контент готов для ${link} | Текст: "${foundText.substring(0, 100)}..."`);
  } catch (e: any) {
    log.warn(`⚠️ Не дождались идеальной отрисовки для ${link}, делаем как есть: ${e.message}`);
    await page.waitForTimeout(1000);
  }

  const screenshotOptions: any = { fullPage: true };
  if (TEST_SCREENSHOTS) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeUrl = link.replace(/https?:\/\//, '').replace(/[\/:?=&]/g, '_').substring(0, 50);
    screenshotOptions.path = path.join(TEST_SCREENS_DIR, `tg_${timestamp}_${safeUrl}.png`);
  }

  const buffer = await page.screenshot(screenshotOptions);
  log.info("✅ Скриншот успешно сделан");
  
  return buffer;
}


export async function captureInstagramPostScreenshot(page: Page, postUrl: string): Promise<IPostCapture | IErrorCallback> {
  await page.goto(postUrl, { waitUntil: "domcontentloaded" });
  const privateH2 = await page.$('h2:has-text("This account is private")');

  if (privateH2) {
    log.info(`Аккаунт приватный | Post Url = ${postUrl}`);
    return {
      success: false,
      code: 1002,
      message: "PRIVATE_ACCOUNT_INSTAGRAM",
    };
  } else {
    log.info(`Аккаунт открытый | Post Url = ${postUrl}`);
  }

  await page.waitForTimeout(3000);
  await acceptInstagramCookiesIfExists(page);
  await page.waitForTimeout(3000); 
  await closeInstagramDialogIfExists(page);

  const screenshotOptions: any = {
    fullPage: true,
    type: 'png',
    omitBackground: true,
    clip: { x: 0, y: 0, width: 1280, height: 800 } 
  };

  if (TEST_SCREENSHOTS) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeUrl = postUrl.replace(/https?:\/\//, '').replace(/[\/:?=&]/g, '_').substring(0, 50);
    screenshotOptions.path = path.join(TEST_SCREENS_DIR, `ig_${timestamp}_${safeUrl}.png`);
  }

  const buffer = await page.screenshot(screenshotOptions);

  return { buffer, success: true };
}

export async function acceptInstagramCookiesIfExists(page: Page) {
  try {
    const cookieButton = page.locator('button', { hasText: 'Allow all cookies' });
    if (await cookieButton.count() > 0) {
      await cookieButton.click();
      await page.waitForTimeout(1000);
    } else {
      log.error("Кнопка 'Allow all cookies' не найдена, продолжаем");
    }
  } catch (e) {
    log.error(`Ошибка при попытке принять куки: ${JSON.stringify(e)}`);
  }
}


export async function closeInstagramDialogIfExists(page: Page) {
  const dialog = await page.$('div[role="dialog"]');
  if (dialog) {
    const btn = await dialog.$('div[role="button"] svg');
    if (btn) {
      const btnWrapper = await btn.evaluateHandle(node => node.parentElement);
      await btnWrapper.asElement()?.click().catch(() => null);
    }
  }
}