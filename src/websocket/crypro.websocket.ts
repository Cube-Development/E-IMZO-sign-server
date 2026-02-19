import WebSocket from "ws";
import { log } from "../utils";

export const createWebSocket = (url: string): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    log.info(`🔌 Подключаемся к WebSocket: ${url}`);
    
    const ws = new WebSocket(url, {
          rejectUnauthorized: false,
          headers: {
            'Origin': "https://blogix.uz",
            'Host': '127.0.0.1:64443',
          }
        });

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Таймаут подключения к WebSocket"));
    }, 10000);

    ws.on("open", () => {
      clearTimeout(timeout);
      log.success("✅ WebSocket подключен");
      resolve(ws);
    });

    ws.on("error", (error) => {
      clearTimeout(timeout);
      log.error(`❌ Ошибка WebSocket: ${error}`);
      reject(error);
    });

    ws.on("close", (code, reason) => {
      log.debug(`🔌 WebSocket закрыт: код ${code}, причина: ${reason}`);
    });
  });
};