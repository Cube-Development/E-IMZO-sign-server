import WebSocket from "ws";
import { Certificate, WebSocketMessage, WebSocketResponse, CreateSignatureResponse } from "../type";

const sendMessage = (ws: WebSocket, message: WebSocketMessage): Promise<WebSocketResponse> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Таймаут запроса к криптосервису"));
    }, 30000);

    const messageHandler = (data: WebSocket.Data) => {
      try {
        clearTimeout(timeout);
        ws.off("message", messageHandler);
        
        const response: WebSocketResponse = JSON.parse(data.toString());
        
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.reason || "Ошибка криптографического сервиса"));
        }
      } catch (error) {
        reject(new Error(`Ошибка парсинга ответа: ${error}`));
      }
    };

    ws.on("message", messageHandler);
    
    try {
      ws.send(JSON.stringify(message));
      // console.log("📤 Отправлено сообщение:", message.name);
    } catch (error) {
      clearTimeout(timeout);
      ws.off("message", messageHandler);
      reject(new Error(`Ошибка отправки сообщения: ${error}`));
    }
  });
};


export const getCertificates = async (ws: WebSocket): Promise<Certificate[]> => {
  // console.log("📋 Получаем список сертификатов...");
  
  const message: WebSocketMessage = {
    plugin: "pfx",
    name: "list_all_certificates",
  };

  const response = await sendMessage(ws, message);

  if (!response.certificates || response.certificates.length === 0) {
    throw new Error("Сертификаты не найдены");
  }
  
  // console.log(`✅ Найдено ${response.certificates.length} сертификатов`);
  return response.certificates;
};

export const loadKey = async (ws: WebSocket, cert: Certificate): Promise<string> => {
  // console.log(`🔑 Загружаем ключ для сертификата: ${cert.name}`);
  
  const message: WebSocketMessage = {
    plugin: "pfx",
    name: "load_key",
    arguments: [cert.disk, cert.path, cert.name, cert.alias],
  };

  const response = await sendMessage(ws, message);
  
  if (!response.keyId) {
    throw new Error("Не удалось загрузить ключ");
  }
  
  // console.log("✅ Ключ загружен успешно");
  return response.keyId;
};

export const createSignature = async (
  ws: WebSocket,
  keyId: string,
  row: string
): Promise<CreateSignatureResponse> => {
  // console.log("✍️ Создаём цифровую подпись...");
    const base64Data = Buffer.from(row, 'utf8').toString('base64');
  
  
  const message: WebSocketMessage = {
    plugin: "pkcs7",
    name: "create_pkcs7",
    arguments: [base64Data, keyId, "no"],
  };

  const response = await sendMessage(ws, message);
  
  if (!response.pkcs7_64 || !response.signature_hex) {
    throw new Error("Не удалось создать подпись");
  }
  
  // console.log("✅ Подпись создана успешно");
  return {
    pkcs7_64: response.pkcs7_64,
    signature_hex: response.signature_hex,
  };
};
