// src/modules/eimzo/session.ts
import WebSocket from "ws";
import { Mutex } from "async-mutex";
import { login } from "../../actions";
import { tokenManager } from "../../api";
import { CRYPTOAPI_WSS, LOGIN_REFRESH_DELAY } from "../../config";
import { log } from "../../utils";
import { createWebSocket } from "../../websocket";

export class EImzoSession {
  private ws: WebSocket | null = null;
  private keyId: string | null = null;
  private refreshIntervalMs = LOGIN_REFRESH_DELAY * 60 * 1000;
  private intervalHandle: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private reconnectMutex = new Mutex(); // защита от параллельных reconnect

  constructor() {
    tokenManager.registerRefresh(() => this.reconnect());
  }

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
        await new Promise((res) => setTimeout(res, 1000));
      }
    }

    throw new Error("❌ Не удалось инициализировать EImzoSession после нескольких попыток");
  }

  private async login() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }

    this.ws = await createWebSocket(CRYPTOAPI_WSS);
    const { token, keyId } = await login(this.ws);
    this.keyId = keyId;
    tokenManager.setToken(token);

    log.websocket("🔑 EImzoSession вошла в систему / токен обновлён");
  }

  private startAutoRefresh() {
    if (this.intervalHandle) clearInterval(this.intervalHandle);

    this.intervalHandle = setInterval(async () => {
      if (!this.isActive) return;
      
      try {
        log.websocket("🔄 Автообновление токена и keyId...");
        await this.init();
      } catch (err) {
        log.error(`Ошибка при автообновлении EImzoSession: ${err}`);
      }
    }, this.refreshIntervalMs);
  }

  /**
   * Возвращает активный WebSocket.
   * Mutex гарантирует: при 50 параллельных вызовах reconnect произойдёт только 1 раз,
   * остальные дождутся и получат уже готовое соединение.
   */
  public async getActiveWs(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    // Mutex: первый вызов делает reconnect, остальные ждут
    return this.reconnectMutex.runExclusive(async () => {
      // double-check после ожидания (предыдущий вызов мог уже переподключить)
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        return this.ws;
      }

      log.warn("⚠️ WebSocket не активен, авто-переподключение...");
      await this.reconnect();
      return this.ws!;
    });
  }

  public getWs() {
    return this.ws;
  }

  public getKeyId() {
    return this.keyId;
  }

  public setKeyId(newKeyId: string) {
    this.keyId = newKeyId;
  }

  public isSessionActive(): boolean {
    return this.isActive;
  }

  public isWsReady(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public async close(): Promise<void> {
    log.info("🛑 Закрытие EImzoSession...");
    
    this.isActive = false;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }

    this.ws = null;
    this.keyId = null;

    log.success("✅ EImzoSession закрыта");
  }

  public async reconnect(): Promise<void> {
    log.info("🔄 Переподключение EImzoSession...");
    await this.close();
    await this.init();
  }
}