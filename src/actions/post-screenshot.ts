import { Browser, chromium } from "playwright";
import { Semaphore } from "async-mutex";
import { captureInstagramPostScreenshot, ensureAuth, handleTelegramLink, uploadScreenshot } from "../screenshot";
import { log } from "../utils";
import { getUploadLink } from "../api";
import { IErrorCallback, IPostCapture, IPostScreenshotResponse } from "../type";

// ==========================================
// Browser Pool — один Chromium на все запросы
// ==========================================
const MAX_CONCURRENT_SCREENSHOTS = 5;
const screenshotSemaphore = new Semaphore(MAX_CONCURRENT_SCREENSHOTS);

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    sharedBrowser = await chromium.launch({ 
      headless: true,
      args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox']
    });
    log.info("🌐 Chromium запущен (shared instance)");
  }
  return sharedBrowser;
}

/** Закрытие shared browser (для graceful shutdown) */
export async function closeBrowser(): Promise<void> {
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

    if (isTelegramUrl(url)) {
      log.info(`Обработка Telegram URL | Post Url = ${url} | User Bot ID = ${user_bot_id}`);
      const auth_path = `src/auth/telegram/user_bot_${user_bot_id || 1}/auth.json`;
      await ensureAuth(auth_path);

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
      const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } });

      try {
        const page = await context.newPage();
        const resp = await captureInstagramPostScreenshot(page, url);

        if (!resp.success) {
          return { ...resp as IErrorCallback };
        }
        screenshot = (resp as IPostCapture)?.buffer as Buffer;
      } finally {
        await context.close();
      }

    } else {
      return { success: false, code: 1003, message: "UNSUPPORTED_URL" };
    }

    log.info(`Скриншот сделан, получаем ссылку для загрузки... | Post Url = ${url}`);
    const uploadData = await getUploadLink();

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
