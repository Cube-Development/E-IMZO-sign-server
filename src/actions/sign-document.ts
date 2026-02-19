import { runAutoItScript } from "../script/auto-it";
import { createAttachedSignature, createSignature, getCertificates, loadKey } from "../websocket";
import { log } from "../utils";
import { createSignEDO, getSignInfoEDO, getTimestamp } from "../api";
import WebSocket from "ws";

export const signDocument = async (
  documentId: string,
  owner: 0 | 1 = 0,
  ws: WebSocket,
  oldKeyId?: string | null,
): Promise<{keyId: string, success: boolean}> => {
  const prefix = `Document ID: ${documentId} | owner: ${owner}`;
  log.info(`${prefix} | 🚀 Начинаем подписание документа`);

  try {
    // 1. Получаем JSON документа
    const {documentJson, toSign} = await getSignInfoEDO(documentId, owner);
    log.api(`${prefix} | Получен JSON для подписи`);

    let keyId: string;
    let pkcs7_64: string;
    let signature_hex: string;
    let base64Data: string = owner === 1 ? JSON.stringify(documentJson) : toSign
    const signFunction = owner === 1 ? createSignature: createAttachedSignature

    if (!oldKeyId) {
      // 2. Получаем сертификаты
      const certificates = await getCertificates(ws);
      log.crypto(`${prefix} | Получено сертификатов: ${certificates.length}`);

      if (!certificates.length) {
        console.error(`${prefix} | Сертификаты не найдены`);
        throw new Error("Сертификаты не найдены");
      }

      // 3. Загружаем ключ для первого сертификата
      keyId = await loadKey(ws, certificates[0]);
      log.crypto(`${prefix} | Ключ загружен`);

      // const autoItPromise = runAutoItScript("src/script/auto-sign.au3");
      // log.info(`${prefix} | Запущен AutoIt-скрипт для подписи`);

      // 4. Создаём подпись
      ({ pkcs7_64, signature_hex } = await signFunction(
        ws,
        keyId,
        base64Data
      ));
      log.crypto(`${prefix} | Подпись создана`);

      // await autoItPromise;
      log.info(`${prefix} | AutoIt-скрипт завершён`);
    } else {
        keyId = oldKeyId;
      ({ pkcs7_64, signature_hex } = await signFunction(
        ws,
        keyId,
        base64Data
      ));
      log.crypto(`${prefix} | Подпись создана (старый ключ)`);
    }

    // 5. Получаем timestamp
    const timestamp = await getTimestamp(pkcs7_64, signature_hex, documentId, owner);
    log.api(`${prefix} | Получен timestamp: ${timestamp ? "успешно" : "ошибка"}`);

    if (!timestamp) {
      throw new Error("Не удалось получить timestamp");
    }

    // 6. Отправляем подпись
    await createSignEDO(documentId, timestamp, owner);
    log.success(`${prefix} | Документ успешно подписан!`);

    return {success: true, keyId};
  } catch (error: any) {
    log.error(`${prefix} | 💥 Ошибка при подписании документа: ${JSON.stringify(error?.data)}`);
    throw error;
  }
};
