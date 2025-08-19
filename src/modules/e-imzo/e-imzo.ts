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

  constructor() {}

  // Инициализация при старте сервера
  public async init() {
    await this.login();

    // Запускаем авто-обновление токена и keyId каждый час
    this.startAutoRefresh();

    log.success("✅ EImzoSession инициализирована");
  }

  private async login() {
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
      try {
        log.websocket("🔄 Автообновление токена и keyId...");
        await this.login();
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
}
