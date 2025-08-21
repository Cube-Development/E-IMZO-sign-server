import 'dotenv/config'; 
import { LoopSign } from './loop-sign';
import { runAutoItScript, killAllAutoItProcesses } from '../auto-it';
import { log } from '../../utils';
import { USE_AUTOIT_DEMON } from '../../config';
import { EImzoSession } from '../../modules/e-imzo';

let eimzoSession: EImzoSession | null = null;
let loop: LoopSign | null = null;
let isShuttingDown = false;

async function runner() {
  try {
    // Запускаем AutoIt демон если нужно
    if (!USE_AUTOIT_DEMON) {
      log.info("🤖 Запускаем демона AutoIt");
      
      runAutoItScript("src/script/auto-it/auto-sign-demon.au3", true)
        .then(() => {
          if (!isShuttingDown) {
            log.warn("⚠️ AutoIt-демон завершился неожиданно");
          }
        })
        .catch(err => {
          if (!err.message.includes("завершился с кодом: null") && !isShuttingDown) {
            log.error(`❌ Ошибка демона AutoIt: ${err}`);
          }
        });
      
    //   await new Promise(resolve => setTimeout(resolve, 2000));
      log.success("✅ AutoIt-демон запущен");
    } else {
      log.warn("ℹ️ AutoIt-демон отключен в конфигурации");
    }

    // Инициализируем EImzo сессию
    eimzoSession = new EImzoSession();
    await eimzoSession.init();

    // Запускаем основной процесс
    log.info("🚀 Запускаем LoopSign");
    loop = new LoopSign(eimzoSession);
    await loop.start();

  } catch (error) {
    log.error(`💥 Ошибка в основном процессе: ${error}`);
    throw error;
  }
}

// Обработчики завершения процесса
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  log.warn(`Получен сигнал ${signal}. Дождитесь остановки сервера. Завершаем AutoIt процессы...`);
  
  // Останавливаем LoopSign
  if (loop) {
    await loop.stop();
  }

  // Закрываем EImzo сессию
  if (eimzoSession) {
    await eimzoSession.close();
  }
  
  // Убиваем все AutoIt процессы
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

process.on('exit', () => {
  killAllAutoItProcesses();
});

// Запуск
runner().catch((error) => {
  log.error(`💥 Необработанная ошибка: ${error}`);
  killAllAutoItProcesses();
  process.exit(1);
});