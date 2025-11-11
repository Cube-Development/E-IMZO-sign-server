import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";
import { chromium, Page } from "playwright";
import { log } from "../utils";
import { IErrorCallback, IPostCapture } from "../type";

export async function uploadScreenshot(url: string, bytes: Buffer) {
  await axios.put(url, bytes, {
    headers: { "Content-Type": "image/png" },
  });
}

export function buildWebHrefFromTgaddr(tgaddr: string) {
  if (!tgaddr) return null;
  if (/tg%3A|%3A/.test(tgaddr)) {
    if (tgaddr.startsWith("https://")) return tgaddr;
    return "https://web.telegram.org/a/#?tgaddr=" + tgaddr.split("tgaddr=")[1];
  }
  const raw = tgaddr.startsWith("tg://") ? tgaddr : tgaddr;
  return "https://web.telegram.org/a/#?tgaddr=" + encodeURIComponent(raw);
}


export async function ensureAuth(auth_path: string) {
  if (fs.existsSync(auth_path)) return;

  // создаём уникальную временную папку для чистого профиля
  const tmpProfile = path.join(os.tmpdir(), `pw_profile_${Date.now()}`);
  fs.mkdirSync(tmpProfile, { recursive: true });

  // запустим persistent context в этой папке — чистый профиль гарантирован
  const context = await chromium.launchPersistentContext(tmpProfile, { headless: false, viewport: { width: 1280, height: 800 } });
  const page = context.pages()[0] || await context.newPage();

  console.log("Открылся чистый профиль. Выполните вход в Telegram Web вручную.");
  await page.goto("https://web.telegram.org/k/");

  // ждем подтверждения от пользователя
  console.log("После успешного входа нажмите Enter в консоли.");
  await new Promise<void>((res) => process.stdin.once("data", () => res()));

  // сохраняем storageState в auth.json
  await context.storageState({ path: auth_path });
  await context.close();

  // можно удалить временную папку профиля, если не нужен
  // fs.rmSync(tmpProfile, { recursive: true, force: true });

  console.log("auth.json сохранён из чистого профиля.");
}

export async function closeModalIfExists(page: Page) {
  try {
    const modal = await page.$("div.Modal.error.shown.open");
    // const modal = await page.$("div[role='dialog'], div.modal-dialog, div.tg-dialog']");
    // const modal = await page.$("div.Modal.error")
    // console.log("Модальное окно:", modal);
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
  // Определяем путь для сохранения скриншота
  const screenshotPath = "screenshot.png";
  
  log.info(`Открываю: ${link}`);
  await page.goto(link, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

  const btn = await page.$("a.tgme_action_web_button, a.tgme_action_button_new, a.tgme_action_button");
  if (!btn) {
    log.warn("Кнопка 'Open in Web' не найдена. Просто делаем скриншот.");
    await page.waitForTimeout(3000);
    const buffer = await page.screenshot({ path: screenshotPath, fullPage: true });
    log.info("✅ Скриншот успешно сохранён");
    return buffer;
  }

  const hrefAttr = await btn.getAttribute("href");
  try {
    await btn.click({ timeout: 10000 });
    await page.waitForTimeout(600);
  } catch {}

  let target: string | null = null;
  if (hrefAttr) {
    if (hrefAttr.includes("web.telegram.org")) target = hrefAttr;
    else if (hrefAttr.includes("tgaddr") || hrefAttr.startsWith("tg://") || hrefAttr.includes("privatepost"))
      target = buildWebHrefFromTgaddr(hrefAttr);
    else if (hrefAttr.startsWith("/")) target = "https://t.me" + hrefAttr;
  }

  if (!target) {
    const html = await page.content();
    const m =
      html.match(/(tg(?:%3A|:)\/\/privatepost[^\"]+)/i) || html.match(/tgaddr=([^\"&']+)/i);
    if (m) {
      const found = m[1] ?? m[0];
      target = buildWebHrefFromTgaddr(found);
    }
  }

  if (!target) throw new Error("Не удалось получить web.telegram.org ссылку.");

  log.info(`Перехожу вручную на: ${target}`);
  await page.goto(target, { waitUntil: "domcontentloaded" }).catch(() => null);
  try {
    await page.waitForURL(/web\.telegram\.org/, { timeout: 15000 });
  } catch {
    log.info(`Не дождались окончательного URL. Текущий: ${page.url()}`);
  }

  await page.waitForTimeout(3000);
  await closeModalIfExists(page);

  const buffer = await page.screenshot({ path: screenshotPath, fullPage: true });
  log.info("✅ Скриншот успешно сохранён");
  
  return buffer;
}



export async function captureInstagramPostScreenshot(page: Page, postUrl: string): Promise<IPostCapture | IErrorCallback> {
  const screenshotPath = "instagram_post_screenshot.png";  // Путь для сохранения скриншота

  // Открытие ссылки на Instagram
  // console.log(`Открываю пост: ${postUrl}`);
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

  // Ждем, пока контент страницы загрузится
  await page.waitForTimeout(3000); // Подождать 3 секунды (можно увеличить время, если необходимо)
  await acceptInstagramCookiesIfExists(page);
  await page.waitForTimeout(3000); 
  await closeInstagramDialogIfExists(page);
  // Делаем скриншот всей страницы
  // console.log("Делаю скриншот страницы...");
  const buffer = await page.screenshot({
    path: screenshotPath,   // Путь для сохранения скриншота
    fullPage: true,         // Скриншот всей страницы
    type: 'png',            // Тип файла
    omitBackground: true,   // Прозрачный фон (если нужно)
    clip: { x: 0, y: 0, width: 1280, height: 800 } 
  });

  // console.log("✅ Скриншот успешно сохранён");
  return {buffer, success: true};  // Возвращаем буфер скриншота
}

export async function acceptInstagramCookiesIfExists(page: Page) {
  try {
    // Ищем кнопку по точному тексту
    const cookieButton = page.locator('button', { hasText: 'Allow all cookies' });
    if (await cookieButton.count() > 0) {
      // log.info("Найдена кнопка 'Allow all cookies', нажимаем...");
      await cookieButton.click();
      // Ждём скрытия модалки
      await page.waitForTimeout(1000);
      // log.info("✅ Куки приняты");
    } else {
      log.error("Кнопка 'Allow all cookies' не найдена, продолжаем");
    }
  } catch (e) {
    log.error(`Ошибка при попытке принять куки: ${JSON.stringify(e)}`);
  }
}


export async function closeInstagramDialogIfExists(page: Page) {
  // Ищем диалоговое окно
  const dialog = await page.$('div[role="dialog"]');
if (dialog) {
  // Ищем svg с title="Close" внутри диалога
   const btn = await dialog.$('div[role="button"] svg');
  if (btn) {
    // Кликаем по родительскому div кнопки
    const btnWrapper = await btn.evaluateHandle(node => node.parentElement);
    await btnWrapper.asElement()?.click().catch(() => null);
  }
}
}