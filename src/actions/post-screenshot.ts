import { Browser, BrowserContext, chromium } from "playwright";
import { Semaphore } from "async-mutex";
import { captureInstagramPostScreenshot, ensureInstagramAuth, ensureTelegramAuth, handleTelegramLink, uploadScreenshot } from "../screenshot";
import { log } from "../utils";
import { getUploadLink } from "../api";
import { IErrorCallback, IPostCapture, IPostScreenshotResponse } from "../type";

// ==========================================
// Browser Pool — один Chromium на все запросы
// ==========================================
const MAX_CONCURRENT_SCREENSHOTS = 5;
const screenshotSemaphore = new Semaphore(MAX_CONCURRENT_SCREENSHOTS);

let sharedBrowser: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;
let instagramContext: BrowserContext | null = null;
let igContextPromise: Promise<BrowserContext> | null = null;

async function getBrowser(): Promise<Browser> {
  if (sharedBrowser?.isConnected()) return sharedBrowser;
  if (browserPromise) return browserPromise;

  browserPromise = chromium.launch({ 
    headless: true,
    args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox']
  }).then(b => {
    sharedBrowser = b;
    browserPromise = null;
    log.info("🌐 Chromium запущен (shared instance)");
    return b;
  });
  return browserPromise;
}

/** Shared контекст Instagram — JS/CSS кешируются между запросами */
async function getInstagramContext(browser: Browser, authPath: string): Promise<BrowserContext> {
  if (instagramContext) return instagramContext;
  if (igContextPromise) return igContextPromise;

  igContextPromise = browser.newContext({
    storageState: authPath,
    viewport: { width: 1280, height: 1200 }
  }).then(ctx => {
    instagramContext = ctx;
    igContextPromise = null;
    log.info("📸 Instagram shared context создан (кеширование включено)");
    return ctx;
  });
  return igContextPromise;
}

/** Закрытие shared browser (для graceful shutdown) */
export async function closeBrowser(): Promise<void> {
  if (instagramContext) {
    await instagramContext.close().catch(() => null);
    instagramContext = null;
    log.info("📸 Instagram context закрыт");
  }
  if (sharedBrowser && sharedBrowser.isConnected()) {
    await sharedBrowser.close();
    sharedBrowser = null;
    log.info("🌐 Chromium закрыт");
  }
}

const isTelegramUrl = (url: string): boolean => /^https:\/\/t\.me\//.test(url);
const isInstagramUrl = (url: string): boolean => /^https:\/\/www\.instagram\.com\//.test(url);

export const postScreenshot = async (url: string, user_bot_id?: string): Promise<IPostScreenshotResponse | IErrorCallback> => {
  const [, release] = await screenshotSemaphore.acquire();

  try {
    const browser = await getBrowser();
    let screenshot: Buffer;

    // Запускаем получение upload link параллельно со скриншотом
    const uploadLinkPromise = getUploadLink();

    if (isTelegramUrl(url)) {
      log.info(`Обработка Telegram URL | Post Url = ${url} | User Bot ID = ${user_bot_id}`);
      const auth_path = `src/auth/telegram/user_bot_${user_bot_id || 1}/auth.json`;
      await ensureTelegramAuth(auth_path);

      const context = await browser.newContext({
        storageState: auth_path,
        viewport: { width: 1280, height: 1600 },
      });

      try {
        const page = await context.newPage();
        screenshot = await handleTelegramLink(page, url);
      } finally {
        await context.close();
      }

    } else if (isInstagramUrl(url)) {
      log.info(`Обработка Instagram URL | Post Url = ${url}`);
      const auth_path = `src/auth/instagram/auth.json`;
      await ensureInstagramAuth(auth_path);

      // Shared контекст для Instagram — JS/CSS кешируются между запросами
      const context = await getInstagramContext(browser, auth_path);
      const page = await context.newPage();

      try {
        const resp = await captureInstagramPostScreenshot(page, url);

        if (!resp.success) {
          return { ...resp as IErrorCallback };
        }
        screenshot = (resp as IPostCapture)?.buffer as Buffer;
      } finally {
        await page.close();
        log.info(`📸 Instagram context закрыт`);
      }

    } else {
      return { success: false, code: 1003, message: "UNSUPPORTED_URL" };
    }

    let uploadData;
    try {
      uploadData = await uploadLinkPromise;
    } catch (e: any) {
      log.error(`❌ Не удалось получить ссылку для загрузки: ${e.message}`);
      return { success: false, code: 1005, message: "UPLOAD_FAILED" };
    }

    log.info(`Загружаем скриншот в хранилище... | Post Url = ${url} | File name = ${uploadData.file_name}`);
    await uploadScreenshot(uploadData.url, screenshot as Buffer);

    log.success(`Успешно загружено! | Post Url = ${url} | File name = ${uploadData.file_name}`);

    return {
      success: true,
      file_name: uploadData.file_name,
    };
  } finally {
    release();
  }
};
