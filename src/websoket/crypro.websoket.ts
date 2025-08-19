import WebSocket from "ws";

export const createWebSocket = (url: string): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    console.log(`🔌 Подключаемся к WebSocket: ${url}`);
    
    const ws = new WebSocket(url, {
          rejectUnauthorized: false,
          headers: {
            'Origin': "https://didox.uz",
            'Host': '127.0.0.1:64443',
          }
        });

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Таймаут подключения к WebSocket"));
    }, 10000);

    ws.on("open", () => {
      clearTimeout(timeout);
      console.log("✅ WebSocket подключен");
      resolve(ws);
    });

    ws.on("error", (error) => {
      clearTimeout(timeout);
      console.error("❌ Ошибка WebSocket:", error);
      reject(error);
    });

    ws.on("close", (code, reason) => {
      console.log(`🔌 WebSocket закрыт: код ${code}, причина: ${reason}`);
    });
  });
};