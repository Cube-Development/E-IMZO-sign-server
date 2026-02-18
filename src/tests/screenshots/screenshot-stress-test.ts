import 'dotenv/config';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { SERVER_API_KEY } from '../../config';
import { log } from '../../utils';

const API_URL = 'http://localhost:80/screenshot/post';
const TEST_URLS = [
    'https://t.me/ru2ch/164258',
    'https://t.me/incrypted/30479',
    'https://t.me/if_market_news/80262',
    'https://t.me/ulbi_tv/281',
];

const NUM_CONCURRENT_REQUESTS = 10;

// Настройка ретраев для обхода Rate Limiter (5 RPS)
axiosRetry(axios, { 
    retries: 5, 
    retryDelay: (retryCount) => {
        log.info(`[Retry] Попытка ${retryCount} для запроса...`);
        return 1000; // фиксированная задержка 1с (соответствует windowMs лимитера)
    },
    retryCondition: (error) => {
        return error.response?.status === 429;
    },
    shouldResetTimeout: true // Сбрасываем таймаут axios при каждой попытке
});

async function sendScreenshotRequest(id: number) {
    const url = TEST_URLS[id % TEST_URLS.length];
    const start = Date.now();
    
    log.info(`[Req ${id}] 🚀 Отправлен запрос: ${url}`);
    
    try {
        const response = await axios.post(API_URL, {
            post_url: url,
            user_bot_id: "1"
        }, {
            headers: {
                'X-API-Key': SERVER_API_KEY
            },
            timeout: 180000 // Увеличиваем до 180с, так как ретраи занимают время
        });
        const duration = Date.now() - start;
        log.info(`[Req ${id}] ✅ SUCCESS | Time: ${duration}ms | File: ${response.data.file_name}`);
    } catch (error: any) {
        const duration = Date.now() - start;
        const errorMsg = error.response?.data?.message || error.message;
        log.error(`[Req ${id}] ❌ FAILED | Time: ${duration}ms | Error: ${errorMsg}`);
    }
}

async function runScreenshotStressTest() {
    log.info(`🔥 Starting Stress Test: ${NUM_CONCURRENT_REQUESTS} parallel requests...`);
    
    const tasks = Array.from({ length: NUM_CONCURRENT_REQUESTS }, (_, i) => sendScreenshotRequest(i + 1));
    
    const startOverall = Date.now();
    await Promise.all(tasks);
    const totalDuration = Date.now() - startOverall;
    
    log.info(`\n🏁 Test Finished in ${totalDuration}ms`);
}

runScreenshotStressTest();
