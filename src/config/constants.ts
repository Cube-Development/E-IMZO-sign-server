import { z } from "zod";

/**
 * Zod-схема для валидации env-переменных при старте.
 * Сервер не запустится без обязательных переменных — ошибка будет читаемой.
 */
const envSchema = z.object({
  // Внешние сервисы
  CRYPTOAPI_WSS_URL: z.url("CRYPTOAPI_WSS_URL должен быть валидным URL"),
  DIDOX_API_URL:     z.url("DIDOX_API_URL должен быть валидным URL"),
  BLOGIX_API_URL:    z.url("BLOGIX_API_URL должен быть валидным URL"),
  SERVER_API_KEY:    z.string().min(1, "SERVER_API_KEY обязателен"),
  BLOGIX_API_KEY:    z.string().min(1, "BLOGIX_API_KEY обязателен"),

  // ЭЦП
  ECP_KEY_PASSWORD:  z.string().min(1, "ECP_KEY_PASSWORD обязателен"),

  // Опциональные с дефолтами
  LOGIN_REFRESH_DELAY:  z.coerce.number().positive().default(60),
  LOOP_SIGN_DELAY:      z.coerce.number().positive().default(1),
  LOOP_STREAMS_COUNT:   z.coerce.number().int().positive().default(1),
  USE_AUTOIT_DEMON:     z.string().default("false"),
  AUTOIT_APP_PATH:      z.string().default("C:\\Program Files (x86)\\AutoIt3\\AutoIt3.exe"),
  TEST_SCREENSHOTS:     z.string().default("false"),
  MAX_SIGN_LIMIT:       z.coerce.number().int().positive().default(10),
  MAX_SCREENSHOT_LIMIT: z.coerce.number().int().positive().default(5),
  PORT:                 z.coerce.number().int().positive().default(3000),
  USE_INSECURE_TLS:     z.string().default("false"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Ошибка валидации env-переменных:");
  for (const issue of parsed.error.issues) {
    console.error(`   • ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

// Внешние сервисы (API + ключи)
export const CRYPTOAPI_WSS      = env.CRYPTOAPI_WSS_URL;
export const DIDOX_URL          = env.DIDOX_API_URL;
export const BLOGIX_API_URL     = env.BLOGIX_API_URL;
export const SERVER_API_KEY     = env.SERVER_API_KEY;
export const BLOGIX_API_KEY     = env.BLOGIX_API_KEY;

// ЭЦП и AutoIT
export const ECP_PASSWORD       = env.ECP_KEY_PASSWORD;
export const USE_AUTOIT_DEMON   = env.USE_AUTOIT_DEMON === "true";
export const AUTOIT_APP_PATH    = env.AUTOIT_APP_PATH;

// Циклы, задержки и потоки
export const LOGIN_REFRESH_DELAY = env.LOGIN_REFRESH_DELAY;
export const LOOP_SIGN_DELAY     = env.LOOP_SIGN_DELAY;
export const LOOP_STREAMS_COUNT  = env.LOOP_STREAMS_COUNT;

// Лимиты и порт
export const TEST_SCREENSHOTS    = env.TEST_SCREENSHOTS === "true";
export const MAX_SIGN_LIMIT      = env.MAX_SIGN_LIMIT;
export const MAX_SCREENSHOT_LIMIT = env.MAX_SCREENSHOT_LIMIT;
export const PORT                = env.PORT;