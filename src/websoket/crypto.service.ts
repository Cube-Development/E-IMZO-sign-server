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


export const addApiKey = async (ws: WebSocket): Promise<boolean> => {
  
  const message: WebSocketMessage = {
    name: "apikey",
    arguments: [
      "localhost",
      "96D0C1491615C82B9A54D9989779DF825B690748224C2B04F500F370D51827CE2644D8D4A82C18184D73AB8530BB8ED537269603F61DB0D03D2104ABF789970B",
      "127.0.0.1",
      "A7BCFA5D490B351BE0754130DF03A068F855DB4333D43921125B9CF2670EF6A40370C646B90401955E1F7BC9CDBF59CE0B2C5467D820BE189C845D0B79CFC96F",
      "blogix.uz",
      "CB1B8AE5ED0253C1E0683E88A69098946230F142038B6F7E644D303ACC54D63537DC5D8CDE0D9D76E4C02ADB362EA2817E0CF62B41D3B7CFA4427E4A7460526D",
    ],
  };

  const response = await sendMessage(ws, message);

  if (!response.success) {
    throw new Error("Не удалось добавить API ключ");
  }

  return true;
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
  const base64Data = Buffer.from(row, 'utf8').toString('base64');
  
  const message: WebSocketMessage = {
    plugin: "pkcs7",
    name: "create_pkcs7",
    arguments: [base64Data, keyId, "no"],
  };

  const response = await sendMessage(ws, message);

  if (!response?.pkcs7_64 || !response?.signature_hex || !response?.signer_serial_number) {
    throw new Error("Не удалось создать подпись");
  }
  
  return {
    pkcs7_64: response.pkcs7_64,
    signature_hex: response.signature_hex,
    signer_serial_number: response?.signer_serial_number
  };
};

export const createAttachedTokenSignature = async (
  ws: WebSocket,
  pkcs7_64: string,
  signer_serial_number: string,
  tokenBase64: string,
): Promise<CreateSignatureResponse> => {
  
  const message: WebSocketMessage = {
    plugin: "pkcs7",
    name: "attach_timestamp_token_pkcs7",
    arguments: [pkcs7_64, signer_serial_number, tokenBase64],
  };

  const response = await sendMessage(ws, message);

  if (!response?.pkcs7_64 || !response?.signer_serial_number) {
    throw new Error("Не удалось создать подпись");
  }
  
  return {
    pkcs7_64: response.pkcs7_64,
    signer_serial_number: response?.signer_serial_number,
    signature_hex: ""
  };
};


export const createAttachedSignature = async (
  ws: WebSocket,
  keyId: string,
  row: string
): Promise<CreateSignatureResponse> => {
  const message: WebSocketMessage = {
    plugin: "pkcs7",
    name: "append_pkcs7_attached",
    arguments: [row, keyId],
  };

  const response = await sendMessage(ws, message);
  
  if (!response?.pkcs7_64 || !response?.signature_hex || !response?.signer_serial_number) {
    throw new Error("Не удалось создать подпись");
  }
  
  return {
    pkcs7_64: response.pkcs7_64,
    signature_hex: response.signature_hex,
    signer_serial_number: response.signer_serial_number,
  };
};