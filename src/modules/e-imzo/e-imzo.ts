// src/modules/eimzo/session.ts
import { login } from "../../actions";
import { setAuthToken } from "../../api";
import { CRYPTOAPI_WSS, LOGIN_REFRESH_DELAY } from "../../config";
import { log } from "../../utils";
import { createWebSocket } from "../../websoket";

export class EImzoSession {
  private ws: any = null;
  private keyId: string | null = null;
  private refreshIntervalMs = LOGIN_REFRESH_DELAY * 60 * 1000; // n минут
  private intervalHandle: NodeJS.Timeout | null = null;
  private isActive: boolean = false;

  constructor() {}

  // Инициализация при старте сервера
  public async init() {
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        await this.login();
        this.startAutoRefresh();
        this.isActive = true;
        log.success("✅ EImzoSession инициализирована");
        return;
      } catch (err) {
        retries++;
        log.error(`❌ Ошибка логина (попытка ${retries}/${maxRetries}): ${err}`);
        await new Promise((res) => setTimeout(res, 1000)); // ждем 1 сек перед повтором
      }
    }

    throw new Error("❌ Не удалось инициализировать EImzoSession после нескольких попыток");
  }

  private async login() {
    // Закрываем предыдущее соединение если есть
    if (this.ws && this.ws.readyState === this.ws.OPEN) {
      this.ws.close();
    }

    // Подключение к WebSocket
    this.ws = await createWebSocket(CRYPTOAPI_WSS);

    // Логин и получение токена + keyId
    const { token, keyId } = await login(this.ws);
    this.keyId = keyId;

    // Сохраняем токен для API
    setAuthToken(token);

    log.websocket("🔑 EImzoSession вошла в систему / токен обновлён");
  }

  // Метод для авто-обновления токена
  private startAutoRefresh() {
    if (this.intervalHandle) clearInterval(this.intervalHandle);

    this.intervalHandle = setInterval(async () => {
      if (!this.isActive) return; // Не обновляем если сессия закрыта
      
      try {
        log.websocket("🔄 Автообновление токена и keyId...");
        await this.init();
      } catch (err) {
        log.error(`Ошибка при автообновлении EImzoSession: ${err}`);
      }
    }, this.refreshIntervalMs);
  }

  // Метод для получения ws
  public getWs() {
    return this.ws;
  }

  // Метод для получения keyId
  public getKeyId() {
    return this.keyId;
  }

  // Метод для обновления keyId вручную
  public setKeyId(newKeyId: string) {
    this.keyId = newKeyId;
  }

  // Метод для проверки активности
  public isSessionActive(): boolean {
    return this.isActive;
  }

  // Метод для закрытия сессии
  public async close(): Promise<void> {
    log.info("🛑 Закрытие EImzoSession...");
    
    this.isActive = false;

    // Останавливаем автообновление
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      log.debug("⏰ Автообновление токена остановлено");
    }

    // Закрываем WebSocket соединение
    if (this.ws && this.ws.readyState === this.ws.OPEN) {
      this.ws.close();
      log.websocket("🔌 WebSocket соединение закрыто");
    }

    // Очищаем состояние
    this.ws = null;
    this.keyId = null;

    log.success("✅ EImzoSession закрыта");
  }

  // Метод для переподключения (полезно при ошибках)
  public async reconnect(): Promise<void> {
    log.info("🔄 Переподключение EImzoSession...");
    await this.close();
    await this.init();
  }
}