/**
 * =========================
 * Внешние сервисы (API + ключи)
 * =========================
 */

// WebSocket адрес криптосервиса для работы с ЭЦП 
export const CRYPTOAPI_WSS = process.env.CRYPTOAPI_WSS_URL!;

// REST API адрес сервиса Didox (электронный документооборот)
export const DIDOX_URL = process.env.DIDOX_API_URL!;

// REST API адрес сервиса Blogix
export const BLOGIX_API_URL = process.env.BLOGIX_API_URL!;

// API-ключ для доступа к внутреннему серверному API
export const SERVER_API_KEY = process.env.SERVER_API_KEY!;

// API-ключ для доступа к Blogix API
export const BLOGIX_API_KEY = process.env.BLOGIX_API_KEY!;


/**
 * =========================
 * Циклы, задержки и потоки
 * =========================
 */

// Интервал обновления логина/токена (в минутах)
export const LOGIN_REFRESH_DELAY = Number(process.env.LOGIN_REFRESH_DELAY! || 60);

// Задержка между итерациями цикла подписания (в минутах)
export const LOOP_SIGN_DELAY = Number(process.env.LOOP_SIGN_DELAY! || 1);

// Количество параллельных потоков для подписи документов
export const LOOP_STREAMS_COUNT = Number(process.env.LOOP_STREAMS_COUNT! || 1);


/**
 * =========================
 * ЭЦП и AutoIT
 * =========================
 */

// Пароль от ключа ЭЦП (закрытый ключ для подписи)
export const ECP_PASSWORD = process.env.ECP_KEY_PASSWORD!;

// Флаг использования AutoIT демона для автоматизации (true/false)
export const USE_AUTOIT_DEMON = process.env.USE_AUTOIT_DEMON! === 'true';

// Путь к исполняемому файлу AutoIT (по умолчанию стандартная установка в Windows)
export const AUTOIT_APP_PATH =
  process.env.AUTOIT_APP_PATH || "C:\\Program Files (x86)\\AutoIt3\\AutoIt3.exe";
