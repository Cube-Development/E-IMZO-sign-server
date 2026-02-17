import 'dotenv/config';

import bodyParser from "body-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import { ROUTES_SIGN, signRouter } from "./modules/sign-didox";
import { ROUTES_SCREENSHOT, postScreenshotRouter } from "./modules/post-screenshot";
import { EImzoSession } from "./modules/e-imzo";
import { closeBrowser } from "./actions/post-screenshot";
import { runAutoItScript, killAllAutoItProcesses } from './script/auto-it';
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from './utils/swagger';
import { USE_AUTOIT_DEMON } from './config';
import { log } from './utils';

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ==========================================
// Rate Limiting (express-rate-limit)
// ==========================================
const signLimiter = rateLimit({
  windowMs: 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Слишком много запросов. Макс. 10 RPS. Повторите позже.",
  },
});

const screenshotLimiter = rateLimit({
  windowMs: 1000,
  max: 10,                       // макс. 10 RPS
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Слишком много запросов на скриншоты. Макс. 10 RPS.",
  },
});

// Подключаем Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

if (USE_AUTOIT_DEMON) {
  log.info("Запускаем демона AutoIt");
  runAutoItScript("src/script/auto-it/auto-sign-demon.au3", true)
    .then(() => log.warn("AutoIt-демон завершился (неожиданно)"))
    .catch(err => {
      if (!err.message.includes("завершился с кодом: null")) {
        log.error(`Ошибка демона AutoIt: ${err}`);
      }
    }
    );
} else {
  log.info("AutoIt-демон не используется");
}

export const eImzo = new EImzoSession();

// Инициализация сессии при старте сервера
eImzo.init().catch(console.error);

app.get("/", (req, res) => {
  res.send("SERVER IS STARTED");
});

// ==========================================
// Health Check
// ==========================================
app.get("/health", (req, res) => {
  const wsReady = eImzo.isWsReady();
  const sessionActive = eImzo.isSessionActive();
  const status = sessionActive && wsReady ? 200 : 503;

  res.status(status).json({
    status: status === 200 ? "ok" : "degraded",
    ws: wsReady,
    session: sessionActive,
  });
});

app.use(ROUTES_SIGN.BASE, signLimiter, signRouter);
app.use(ROUTES_SCREENSHOT.BASE, screenshotLimiter, postScreenshotRouter);

const port = Number(process.env.PORT) || 3000;

// ==========================================
// Graceful Shutdown с drain
// ==========================================
const server = app.listen(port, "0.0.0.0", () => {
  log.info(`Server is running on port ${port}`);
});

const gracefulShutdown = async (signal: string) => {
  log.warn(`Получен сигнал ${signal}. Останавливаем сервер...`);

  // Перестаём принимать новые соединения
  server.close(() => {
    log.info("HTTP сервер закрыт (новые запросы не принимаются)");
  });

  // Закрываем EImzo сессию
  await eImzo.close();

  // Закрываем shared Chromium
  await closeBrowser();

  // Убиваем AutoIt процессы
  killAllAutoItProcesses();

  log.success("Сервер остановлен ✅");
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

process.on('exit', () => {
  killAllAutoItProcesses();
});