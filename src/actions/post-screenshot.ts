// import { chromium } from "playwright";
// import { captureInstagramPostScreenshot, ensureAuth,  handleTelegramLink, uploadScreenshot } from "../screenshot";
// import { log } from "../utils";
// import { getUploadLink } from "../api";

// export const postScreenshot = async (url: string, user_bot_id?: string):  Promise<{file_name: string, success: boolean}>  => {
//  try{
//     const auth_path = "src/auth/telegram/user_bot_1/auth.json";
// const browser = await chromium.launch({ headless: true });
//   await ensureAuth(auth_path);

//   const context = await browser.newContext({
//     storageState: auth_path,
//     viewport: { width: 1280, height: 1600 },
//   });
//   const page = await context.newPage();

//   const screenshot = await handleTelegramLink(page, url);

//   log.info(`Скриншот сделан, получаем ссылку для загрузки... | Post Url = ${url}`);
//   const uploadData = await getUploadLink();

//   log.info(`Загружаем скриншот в хранилище... | Post Url = ${url} | File name = ${uploadData.file_name}`);

//   await uploadScreenshot(uploadData.url, screenshot);

//   log.success(`Успешно загружено! | Post Url = ${url} | File name = ${uploadData.file_name}`);
 
//    await browser.close();
//    return {
//      success: true,
//      file_name: uploadData.file_name
//    }
//  } catch (error: any) {
//      log.error(`💥 Ошибка при создании скриншота: ${JSON.stringify(error?.data)}`);
//      throw error;
//    }
// };

import { chromium } from "playwright";
import { captureInstagramPostScreenshot, ensureAuth, handleTelegramLink, uploadScreenshot } from "../screenshot";
import { log } from "../utils";
import { getUploadLink } from "../api";
import { IErrorCallback, IPostCapture, IPostScreenshotResponse } from "../type";

// Функция для определения, является ли ссылка ссылкой на Telegram
const isTelegramUrl = (url: string): boolean => /^https:\/\/t\.me\//.test(url);

// Функция для определения, является ли ссылка ссылкой на Instagram
const isInstagramUrl = (url: string): boolean => /^https:\/\/www\.instagram\.com\//.test(url);

export const postScreenshot = async (url: string, user_bot_id?: string): Promise<IPostScreenshotResponse | IErrorCallback> => {
  const browser = await chromium.launch({ headless: true });
  let screenshot: Buffer;

    if (isTelegramUrl(url)) {
      log.info(`Обработка Telegram URL | Post Url = ${url} | User Bot ID = ${user_bot_id}`);
      const auth_path = `src/auth/telegram/user_bot_${user_bot_id || 1}/auth.json`;
      await ensureAuth(auth_path); // Проверка или создание сессии

      const context = await browser.newContext({
        storageState: auth_path,
        viewport: { width: 1280, height: 1600 },
      });
      const page = await context.newPage();

      // Получаем скриншот из Telegram
      screenshot = await handleTelegramLink(page, url);

    } else if (isInstagramUrl(url)) {
      log.info(`Обработка Instagram URL | Post Url = ${url}`);
      // Для Instagram аутентификация не нужна, просто получаем скриншот
      const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } });
      // await context.addCookies(INSTAGRAM_COOKIES as any[]);
      const page = await context.newPage();

      // Получаем скриншот из Instagram
      const resp = await captureInstagramPostScreenshot(page, url);
      
      if (!resp.success  ) {
        await browser.close();
        return { ...resp as  IErrorCallback};
      } else {
        screenshot = (resp as IPostCapture)?.buffer as Buffer;
      }

    } else {
      return { success: false, code: 1003, message: "UNSUPPORTED_URL" };
    }

    log.info(`Скриншот сделан, получаем ссылку для загрузки... | Post Url = ${url}`);

    const uploadData = await getUploadLink();

    log.info(`Загружаем скриншот в хранилище... | Post Url = ${url} | File name = ${uploadData.file_name}`);

    await uploadScreenshot(uploadData.url, screenshot as Buffer);

    log.success(`Успешно загружено! | Post Url = ${url} | File name = ${uploadData.file_name}`);

    await browser.close();

    return {
      success: true,
      file_name: uploadData.file_name,
    };
};
