export const CRYPTOAPI_WSS = process.env.CRYPTOAPI_WSS_URL!  ;
export const DIDOX_URL = process.env.DIDOX_API_URL!;
export const LOGIN_REFRESH_DELAY = Number(process.env.LOGIN_REFRESH_DELAY! || 60) ;
export const ECP_PASSWORD = process.env.ECP_KEY_PASSWORD!;
export const USE_AUTOIT_DEMON = process.env.USE_AUTOIT_DEMON! === 'true';
export const AUTOIT_APP_PATH = process.env.AUTOIT_APP_PATH || "C:\\Program Files (x86)\\AutoIt3\\AutoIt3.exe";