import { chromium } from "playwright";
import { ensureAuth, getUploadLink, handleTelegramLink, uploadScreenshot } from "../screenshot";
import { log } from "../utils";

export const postScreenshot = async (url: string, user_bot_id?: string):  Promise<{file_name: string, success: boolean}>  => {
 try{
    const auth_path = "src/auth/telegram/user_bot_1/auth.json";
const browser = await chromium.launch({ headless: true });
  await ensureAuth(auth_path);

  const context = await browser.newContext({
    storageState: auth_path,
    viewport: { width: 1280, height: 1600 },
  });
  const page = await context.newPage();

  const screenshot = await handleTelegramLink(page, url);

  log.info(`Скриншот сделан, получаем ссылку для загрузки... | Post Url = ${url}`);
  const uploadData = await getUploadLink();

  log.info(`Загружаем скриншот в хранилище... | Post Url = ${url} | File name = ${uploadData.file_name}`);

  await uploadScreenshot(uploadData.url, screenshot);

  log.success(`Успешно загружено! | Post Url = ${url} | File name = ${uploadData.file_name}`);
 
   await browser.close();
   return {
     success: true,
     file_name: uploadData.file_name
   }
 } catch (error: any) {
     log.error(`💥 Ошибка при создании скриншота: ${JSON.stringify(error?.data)}`);
     throw error;
   }
};