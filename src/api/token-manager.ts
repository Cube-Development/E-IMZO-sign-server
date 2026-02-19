import { Mutex } from "async-mutex";
import { log } from "../utils";

type RefreshFn = () => Promise<void>;

/**
 * Координатор токена авторизации Didox.
 * Mutex гарантирует: при нескольких 401 refresh произойдёт 1 раз,
 * остальные вызовы дождутся результата.
 */
class TokenManager {
  private static instance: TokenManager;
  private token: string | null = null;
  private refreshFn: RefreshFn | null = null;
  private readonly refreshMutex = new Mutex();

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  setToken(token: string): void {
    this.token = token;
    log.api("🔑 Токен установлен через TokenManager");
  }

  getToken(): string | null {
    return this.token;
  }

  /** EImzoSession регистрирует себя как провайдер refresh */
  registerRefresh(fn: RefreshFn): void {
    this.refreshFn = fn;
  }

  /**
   * Координированный refresh токена.
   * Mutex: первый вызов выполняет refresh, параллельные ждут тот же lock.
   */
  async refreshToken(): Promise<string | null> {
    if (!this.refreshFn) {
      log.error("TokenManager: refresh callback не зарегистрирован");
      throw new Error("Refresh callback not registered");
    }

    return this.refreshMutex.runExclusive(async () => {
      log.warn("🔄 TokenManager: выполняем refresh токена...");
      await this.refreshFn!();
      log.success("🔑 TokenManager: токен обновлён после refresh");
      return this.token;
    });
  }
}

export const tokenManager = TokenManager.getInstance();
