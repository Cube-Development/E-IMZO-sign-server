import { Browser, chromium, Page } from "playwright";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";
import { log } from "../utils";

const CONTENT_TYPE = 2;
const BASE_URL = "https://api.blogix.uz/advblog/api";
const COOKIE = "7c0aaSxHWOMDvlS6Jy8FMWlL8vHF3U0Pzy4Twxd9dpE"; // замени на актуальный токен


export async function getUploadLink() {
  const res = await axios.get(`${BASE_URL}/file/upload_link`, {
    params: { extension: "png", content_type: CONTENT_TYPE },
    headers: { Cookie: `adv-blog=${COOKIE}` },
  });
  return res.data;
}

export async function uploadScreenshot(url: string, bytes: Buffer) {
  await axios.put(url, bytes, {
    headers: { "Content-Type": "image/png", Cookie: `adv-blog=${COOKIE}` },
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
    const modal = await page.$("div[role='dialog'], div.modal-dialog, div.tg-dialog']");
    console.log("Модальное окно:", modal);
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

// export async function handleTelegramLink(page: Page, link: string) {
//   console.log("Открываю:", link);
//   await page.goto(link, { waitUntil: "domcontentloaded" });
//   await page.waitForTimeout(700);

//   // ищем кнопку "Open in Web"
//   const btn = await page.$("a.tgme_action_web_button, a.tgme_action_button_new, a.tgme_action_button");
//   if (!btn) {
//     console.log("Кнопка 'Open in Web' не найдена. Считаем это обычной ссылкой.");
//     await page.waitForTimeout(3000);
//     await page.screenshot({ path: OUT, fullPage: true });
//     console.log("Скриншот сохранён:", OUT);
//     return;
//   }

//   // кнопка найдена, значит пост приватный
//   const hrefAttr = await btn.getAttribute("href");
//   console.log("Найдена кнопка. href =", hrefAttr);

//   try {
//     await btn.click({ timeout: 10000 });
//     await page.waitForTimeout(600);
//   } catch {}

//   let target: string | null = null;
//   if (hrefAttr) {
//     if (hrefAttr.includes("web.telegram.org")) target = hrefAttr;
//     else if (hrefAttr.includes("tgaddr") || hrefAttr.startsWith("tg://") || hrefAttr.includes("privatepost"))
//       target = buildWebHrefFromTgaddr(hrefAttr);
//     else if (hrefAttr.startsWith("/")) target = "https://t.me" + hrefAttr;
//   }

//   if (!target) {
//     const html = await page.content();
//     const m =
//       html.match(/(tg(?:%3A|:)\/\/privatepost[^\"]+)/i) || html.match(/tgaddr=([^\"&']+)/i);
//     if (m) {
//       const found = m[1] ?? m[0];
//       target = buildWebHrefFromTgaddr(found);
//     }
//   }

//   if (!target) {
//     console.error("Не удалось получить web.telegram.org ссылку. Останов.");
//     return;
//   }

//   console.log("Перехожу вручную на:", target);
//   await page.goto(target, { waitUntil: "domcontentloaded" }).catch(() => null);
//   try {
//     await page.waitForURL(/web\.telegram\.org/, { timeout: 15000 });
//   } catch {
//     console.log("Не дождались окончательного URL. Текущий:", page.url());
//   }

//   // ждём загрузку (3 сек) → убирается блюр
//   await page.waitForTimeout(3000);

//   await closeModalIfExists(page);

//   await page.screenshot({ path: OUT, fullPage: true });
//   console.log("Скриншот сохранён:", OUT);
// }

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
