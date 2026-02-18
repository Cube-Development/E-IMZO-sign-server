import path from "path";
import { Page } from "playwright";
import { log } from "../utils";
import { TEST_SCREENSHOTS } from "../config";
import { IErrorCallback, IPostCapture } from "../type";
import { TEST_SCREENS_DIR, getCISDateString } from "./utils";

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
    const timestamp = getCISDateString();
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
