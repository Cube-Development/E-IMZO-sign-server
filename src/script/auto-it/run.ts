import { spawn } from "child_process";
import { AUTOIT_APP_PATH, ECP_PASSWORD } from "../../config";

export const runAutoItScript = (scriptPath: string, noTimeout?: boolean): Promise<void> => {
 return new Promise((resolve, reject) => {
  //  console.log("🤖 Запускаем AutoIt скрипт...");
   
   const autoIt = spawn(AUTOIT_APP_PATH, [scriptPath, ECP_PASSWORD]);

   autoIt.on("close", (code) => {
     if (code === 0) {
      //  console.log("✅ AutoIt скрипт выполнен");
       resolve();
     } else {
       reject(new Error(`AutoIt завершился с кодом: ${code}`));
     }
   });

   autoIt.on("error", (error) => {
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