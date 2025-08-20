import { spawn, ChildProcess } from "child_process";
import { AUTOIT_APP_PATH, ECP_PASSWORD } from "../../config";

// Массив для отслеживания активных процессов
const activeProcesses: ChildProcess[] = [];

export const runAutoItScript = (scriptPath: string, noTimeout?: boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    const autoIt = spawn(AUTOIT_APP_PATH, [scriptPath, ECP_PASSWORD]);
    
    // Добавляем процесс в массив активных
    activeProcesses.push(autoIt);

    autoIt.on("close", (code) => {
      // Удаляем из массива при завершении
      const index = activeProcesses.indexOf(autoIt);
      if (index > -1) {
        activeProcesses.splice(index, 1);
      }

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`AutoIt завершился с кодом: ${code}`));
      }
    });

    autoIt.on("error", (error) => {
      // Удаляем из массива при ошибке
      const index = activeProcesses.indexOf(autoIt);
      if (index > -1) {
        activeProcesses.splice(index, 1);
      }
      reject(new Error(`Ошибка AutoIt: ${error.message}`));
    });

    if (noTimeout) {
      return;
    }
    
    // Таймаут 30 секунд
    setTimeout(() => {
      autoIt.kill();
      reject(new Error("AutoIt timeout"));
    }, 30000);
  });
};

// Функция для завершения всех AutoIt процессов
export const killAllAutoItProcesses = () => {
  activeProcesses.forEach(process => {
    if (!process.killed) {
      process.kill('SIGTERM');
    }
  });
  activeProcesses.length = 0; // Очищаем массив
};