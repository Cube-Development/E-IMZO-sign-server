import axios from "axios";
import axiosRetry from "axios-retry";
import https from "https";
import { BLOGIX_API_KEY, BLOGIX_API_URL } from "../config";
import { IBLogixDocuments } from "../type";
import { log } from "../utils";

const agent = new https.Agent({ rejectUnauthorized: false });

const blogixApi = axios.create({
  baseURL: BLOGIX_API_URL,
  headers: { "Content-Type": "application/json", "X-Api-Key": BLOGIX_API_KEY!},
  timeout: 30000,
  httpsAgent: process.env.USE_INSECURE_TLS === "true" ? agent : undefined,
});

// Retry при 502/503/сетевых ошибках (3 попытки, экспоненциальная задержка)
axiosRetry(blogixApi, {
  retries: 3,
  retryDelay: () => 1000,
  retryCondition: (error) => {
    const status = error.response?.status;
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || status === 502 || status === 503;
  },
  onRetry: (count, error) => {
    log.warn(`⚠️ Blogix API retry ${count}/3: ${error.response?.status || error.message}`);
  },
});


export const getBlogixDocuments = async (owner: 0 | 1 = 1): Promise<IBLogixDocuments> => {
  try {
    const response = await blogixApi.get(`/documents/${owner}`);
    return response?.data;
  } catch (error) {
    log.error(`❌ Ошибка получения документов: ${JSON.stringify(error)}`);
    throw new Error(`Не удалось получить документы: ${JSON.stringify(error)}`);
  }
};


export const signBlogixDocument = async (id: string): Promise<{success: boolean}> => {
  try {
    const response = await blogixApi.post(`/v1/documents/sign/${id}`);
    return response?.data ;
  } catch (error) {
    log.error(`❌ Ошибка подписания документа: ${JSON.stringify(error)}`);
    throw new Error(`Не удалось подписать документ: ${JSON.stringify(error)}`);
  }
};

export const getUploadLink = async (): Promise<{file_name: string, url: string}> => {
  try {
    const CONTENT_TYPE = 2;
    const response = await blogixApi.get(`/file/v/upload_link`, { params: { extension: "png", content_type: CONTENT_TYPE } });
    return response?.data ;
  } catch (error) {
    log.error(`❌ Ошибка получения ссылки для загрузки: ${JSON.stringify(error)}`);
    throw new Error(`Не удалось получить ссылку для загрузки: ${JSON.stringify(error)}`);
  }
};