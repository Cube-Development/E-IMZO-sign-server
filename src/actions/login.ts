import { runAutoItScript } from "../script/auto-it";
import { log, parseCertificateAlias } from "../utils";
import { addApiKey, createSignature, getCertificates, loadKey } from "../websoket";
import { getTimestamp, getTokenByCertificate } from "./../api";

export const login = async (ws?: any): Promise<{token: string, keyId: string}> => {
  try {
    log.info(`🚀 Начинаем логин в систему Didox`);

    // 0. Добавляем API ключ
    await addApiKey(ws);

    // 1. Получаем сертификаты
    const certificates = await getCertificates(ws);
    log.crypto(`Получено сертификатов: ${certificates.length}`);
    if (certificates.length === 0) {
      log.error(`Сертификаты не найдены`);
      throw new Error("Сертификаты не найдены");
    }
    const certInfo = parseCertificateAlias(certificates?.[0]!.alias);
    const pnflFromCert = certInfo?.uid || certInfo.pnfl;

    // 2. Загружаем ключ для первого сертификата
    const keyId = await loadKey(ws, certificates[0]);
    log.crypto(`Ключ загружен`);

    // const autoItPromise = runAutoItScript("src/script/auto-it/auto-sign.au3");
    // log.info(`Запущен AutoIt-скрипт для подписи`);

    // 3. Создаём подпись
    const { pkcs7_64, signature_hex } = await createSignature(ws, keyId, pnflFromCert);
    log.crypto(`Подпись создана`);

    // Ждём завершения AutoIt (опционально)
    // await autoItPromise;
    // log.info(`AutoIt-скрипт завершён`);

    // 4. Получаем timestamp
    const timestamp = await getTimestamp(pkcs7_64, signature_hex, "Login", "login");
    log.api(`Получен timestamp: ${timestamp ? "успешно" : "ошибка"}`);

    if (!timestamp) {
      log.error(` Не удалось получить timestamp`);
      throw new Error("Не удалось получить timestamp");
    }
    // 5. Отправляем подпись
    const  response = await getTokenByCertificate({
        PNFL: pnflFromCert,
        signature: timestamp,
        lang: "ru",
      });
      
    log.success(`✅ Вход в систему выполнен!`);
    return {token: response?.token, keyId};
    
  } catch (error: any) {
    log.error(`💥 Ошибка при логине: ${error.message}`);
    throw error;
  } 
};