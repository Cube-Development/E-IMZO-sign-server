import https from "https";
import axios from "axios";
import axiosRetry from "axios-retry";
import { log } from "../utils";
import { DIDOX_URL } from "../config";
import { IGetTokenRequest, IGetTokenResponse } from "../type";
import { tokenManager } from "./token-manager";

const agent = new https.Agent({ rejectUnauthorized: false });

const authApi = axios.create({
  baseURL: DIDOX_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  httpsAgent: process.env.USE_INSECURE_TLS === "true" ? agent : undefined,
});

// Retry при 429/502/503/сетевых ошибках (3 попытки, задержка 1с)
axiosRetry(authApi, {
  retries: 3,
  retryDelay: () => 1000,
  retryCondition: (error) => {
    const status = error.response?.status;
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      status === 429 ||
      status === 502 ||
      status === 503
    );
  },
  onRetry: (count, error) => {
    log.warn(
      `⚠️ Didox API retry ${count}/3: ${error.response?.status || error.message}`
    );
  },
});

// Interceptor для автоматического добавления токена из TokenManager
authApi.interceptors.request.use(
  (config) => {
    config.headers['user-key'] = tokenManager.getToken();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Retry-interceptor: при 401 координированный refresh через TokenManager
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;
      log.warn("🔄 Получен 401, запрос refresh токена через TokenManager...");
      
      try {
        // Mutex: первый 401 запускает refresh, остальные ждут
        await tokenManager.refreshToken();
        originalRequest.headers['user-key'] = tokenManager.getToken();
        return authApi(originalRequest);
      } catch (refreshError) {
        log.error(`❌ Не удалось обновить токен: ${refreshError}`);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Отдельный инстанс для получения токена (без автоматического добавления токена)
const api = axios.create({
  baseURL: DIDOX_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});


export const getSignInfoEDO = async (documentId: string, owner: 0 | 1 = 0): Promise<{documentJson: object, toSign: string}> => {
 try {
    const response = await authApi.get(`/v1/documents/${documentId}?owner=${owner}`);
    return {documentJson: response?.data?.data?.json || {}, toSign: response?.data?.data?.toSign || ""};
  } catch (error: any) {
    log.error(`❌ Get Document Info Error | Document ID: ${documentId} | Owner: ${owner} | Status: ${error?.response?.status} | Error: ${JSON.stringify(error?.response?.data)}`);

    if (error?.response) {
      // Если это ошибка от сервиса — пробрасываем её дальше с деталями
      throw {
        status: error?.response?.status,
        data: error?.response?.data,
      };
    } else {
      // Все остальные ошибки
      throw {
        data: error?.message || "Unknown error",
        status: 500,
      };
    }
  }
};

export const getTimestamp = async (pkcs7: string, signatureHex: string, documentId: string, owner: any) => {
  try {
    // console.log("⏰ Получаем timestamp...");
    const response = await authApi.post("/v1/dsvs/timestamp", { 
      pkcs7,
      signatureHex,
    });
    const timestamp = response?.data?.timeStampTokenB64;
    // console.log("✅ Timestamp получен");
    return timestamp;
  } catch (error: any) {
    log.error(`❌ Get Timestamp Error | Document ID: ${documentId} | Owner: ${owner} | Status: ${error?.response?.status} | Error: ${JSON.stringify( error?.response?.data)}`);

    if (error?.response) {
      // Если это ошибка от сервиса — пробрасываем её дальше с деталями
      throw {
        status: error?.response?.status,
        data: error?.response?.data,
      };
    } else {
      // Все остальные ошибки
      throw {
        data: error?.message || "Unknown error",
        status: 500,
      };
    }
  }
};

export const createSignEDO = async (documentId: string, signature: string, owner: 0 | 1) => {
  try {
    // console.log(`✍️ Отправляем подпись для документа ${documentId}...`);
    const response = await authApi.post(`/v1/documents/${documentId}/sign`, {
      signature,
    });
    // console.log("✅ Документ подписан успешно");
    return response?.data;
  } catch (error: any) {
    log.error(`❌ Create Sign Error | Document ID: ${documentId} | Owner: ${owner} | Status: ${error?.response?.status} | Error: ${JSON.stringify(error?.response?.data)}`);

    if (error?.response) {
      // Если это ошибка от сервиса — пробрасываем её дальше с деталями
      throw {
        status: error?.response?.status,
        data: error?.response?.data,
      };
    } else {
      // Все остальные ошибки
      throw {
        data: error?.message || "Unknown error",
        status: 500,
      };
    }
  }
};

export const getTokenByCertificate = async (bodyParams: IGetTokenRequest): Promise<IGetTokenResponse> => {
 try {
   const response = await api.post(
     `/v1/auth/${bodyParams.PNFL}/token/${bodyParams.lang}`,
     {
       signature: bodyParams.signature,
     }
   );
   return response?.data;
 } catch (error: any) {
   const status = error?.response?.status;
   const message = error?.response?.data || error?.message || error?.toString();
   console.error("❌ Ошибка получения токена:", `Status: ${status} | ${message}`);
   throw new Error(`Не удалось получить токен: ${error}`);
 }
};