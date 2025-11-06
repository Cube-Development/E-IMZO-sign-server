import 'dotenv/config';

import bodyParser from "body-parser";
import express from "express";
import { ROUTES_SIGN, signRouter } from "./modules/sign-didox";
import { ROUTES_SCREENSHOT, postScreenshotRouter } from "./modules/post-screenshot";
import { EImzoSession } from "./modules/e-imzo";
import { runAutoItScript, killAllAutoItProcesses } from './script/auto-it';
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from './utils/swagger';
import { USE_AUTOIT_DEMON } from './config';
import { log } from './utils';

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Подключаем Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

if (USE_AUTOIT_DEMON) {
  log.info("Запускаем демона AutoIt");
  runAutoItScript("src/script/auto-it/auto-sign-demon.au3", true)
    .then(() => log.warn("AutoIt-демон завершился (неожиданно)"))
    .catch(err => {
      // Игнорируем ошибки при принудительном завершении
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

app.use(ROUTES_SIGN.BASE, signRouter);
app.use(ROUTES_SCREENSHOT.BASE, postScreenshotRouter);

const port = Number(process.env.PORT) || 3000;

// Обработчики завершения процесса
const gracefulShutdown = async (signal: string) => {
 log.warn(`Получен сигнал ${signal}. Дождитесь остановки сервера. Завершаем AutoIt процессы...`);
 killAllAutoItProcesses();
 
 // Обратный отсчет
 for (let i = 3; i > 0; i--) {
   log.info(`Завершение через ${i}...`);
   await new Promise(resolve => setTimeout(resolve, 1000));
 }
 
 log.success("Сервер остановлен ✅");
 process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

// При неожиданном завершении
process.on('exit', () => {
  killAllAutoItProcesses();
});

app.listen(port, "0.0.0.0", () => {
  log.info(`Server is running on port ${port}`);
});