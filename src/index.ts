import 'dotenv/config';

import bodyParser from "body-parser";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { PORT, USE_AUTOIT_DEMON } from './config';
import { ROUTES_SCREENSHOT, postScreenshotRouter, screenshotLimiter } from "./modules/post-screenshot";
import { ROUTES_SIGN, signLimiter, signRouter } from "./modules/sign-didox";
import { killAllAutoItProcesses, runAutoItScript } from './script/auto-it';
import { eImzo, screenshotService } from './services';
import { log } from './utils';
import { openApiDocument } from './utils/swagger';

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Инициализация браузера и сессий при старте
screenshotService.init().catch((err: any) => log.error(`Ошибка прогрева браузера: ${err}`));

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

// Инициализация EImzo сессии при старте сервера
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

const server = app.listen(PORT, "0.0.0.0", () => {
  log.info(`Server is running on port ${PORT}`);
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
  await screenshotService.close();

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