import { signDocument } from "../../actions";
import { getBlogixDocuments, signBlogixDocument } from "../../api";
import { LOOP_SIGN_DELAY, LOOP_STREAMS_COUNT } from "../../config";
import { EImzoSession } from "../../modules/e-imzo";
import { DOCUMENT_TYPES, IBLogixDocument } from "../../type";
import { log } from "../../utils";

export class LoopSign {
  private eimzoSession: EImzoSession;
  private isRunning: boolean = false;
  private stopRequested: boolean = false;
  private currentTimeout: NodeJS.Timeout | null = null;

  constructor(eimzoSession: EImzoSession) {
    this.eimzoSession = eimzoSession;
  }

  async getAllDocuments(): Promise<IBLogixDocument[]> {
    log.info("🔎 Собираем все документы...");
    const { documents } = await getBlogixDocuments();
    log.api(`Черновики | Документов ${documents?.length}`);
    log.success(`Всего исходящих: ${documents.length}`);
    return documents;
  }

  async signAllDocuments() {
    const docs = await this.getAllDocuments();
    log.info(`📊 Найдено ${docs.length} документов для подписания`);

    if (docs.length === 0) {
      log.warn("Нет документов для подписания");
      return;
    }

    // Подписываем первый документ
    // const firstDocument = docs[0];
    // const { keyId: initialKeyId } = await signDocument(
    //   firstDocument.doc_id, 
    //   firstDocument.owner, 
    //   this.eimzoSession.getWs(), 
    //   this.eimzoSession.getKeyId()
    // );
    // this.eimzoSession.setKeyId(initialKeyId);

    // Остаток массива
    const remainingDocs = docs;

    // Функция деления на maxGroups групп
    function splitIntoGroups<T>(arr: T[], maxGroups: number): T[][] {
      const groups: T[][] = [];
      const baseSize = Math.floor(arr.length / maxGroups);
      const extra = arr.length % maxGroups;

      let start = 0;
      for (let i = 0; i < Math.min(maxGroups, arr.length); i++) {
        const size = baseSize + (i < extra ? 1 : 0);
        groups.push(arr.slice(start, start + size));
        start += size;
      }
      return groups;
    }

    const groups = splitIntoGroups(remainingDocs, LOOP_STREAMS_COUNT);

    // Параллельная подпись групп
    for (const [groupIndex, group] of groups.entries()) {
      if (this.stopRequested) {
        log.warn("🛑 Остановка запрошена во время подписания документов");
        break;
      }

      await Promise.all(group.map(async (document) => {
        await this.signOneDocument(document, groupIndex + 1);
      }));
    }
  }


  async signOneDocument(document: IBLogixDocument, groupIndex: number) {
    if (this.stopRequested) return;
    try {
        log.info(`[ПОТОК ${groupIndex }] | Document ID: ${document.doc_id} | owner: ${document.owner} | Doc Type = ${DOCUMENT_TYPES[document.doc_type]} | Created At: ${document.created}`);
        const { keyId, success } = await signDocument(
            document.doc_id, 
            document.owner, 
            this.eimzoSession.getWs()!, 
            this.eimzoSession.getKeyId()
        );
        
        // if (success) await signBlogixDocument(document.doc_id);
        this.eimzoSession.setKeyId(keyId);
    } catch (error) {
        log.error(`[ПОТОК ${groupIndex}] | Document ID: ${document.doc_id} | owner: ${document.owner} | Doc Type = ${DOCUMENT_TYPES[document.doc_type]} | Created At: ${document.created} | Error: ${JSON.stringify(error)}`);
    }
  }

  async start() {
    if (this.isRunning) {
      log.warn("⚠️ LoopSign уже запущен");
      return;
    }

    if (!this.eimzoSession.isSessionActive()) {
      throw new Error("❌ EImzoSession не активна. Инициализируйте сессию перед запуском LoopSign");
    }

    this.isRunning = true;
    this.stopRequested = false;
    log.info("🚀 Запуск LoopSign...");
    
    while (this.isRunning && !this.stopRequested) {
      try {
        // Проверяем активность сессии
        if (!this.eimzoSession.isSessionActive()) {
          log.error("❌ EImzoSession неактивна, попытка переподключения...");
          await this.eimzoSession.reconnect();
        }

        await this.signAllDocuments();
      } catch (error: any) {
        log.error(`Ошибка в цикле подписания: ${JSON.stringify(error)}`);
        
        // При ошибке WebSocket пытаемся переподключиться
        if (error?.message?.includes('WebSocket') || error?.message?.includes('connection')) {
          try {
            await this.eimzoSession.reconnect();
          } catch (reconnectError: any) {
            log.error(`Ошибка переподключения: ${reconnectError?.message}`);
          }
        }
      }

      if (this.stopRequested) {
        log.info("🛑 Остановка запрошена, прерываем цикл");
        break;
      }

      log.info(`⏰ Ожидание ${LOOP_SIGN_DELAY} мин до следующей сессии...`);
      
      await new Promise<void>((resolve) => {
        this.currentTimeout = setTimeout(() => {
          this.currentTimeout = null;
          resolve();
        }, LOOP_SIGN_DELAY * 60 * 1000);
      });
    }

    this.isRunning = false;
    log.success("✅ LoopSign остановлен");
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      log.warn("⚠️ LoopSign не запущен");
      return;
    }

    log.info("🛑 Запрос на остановку LoopSign...");
    this.stopRequested = true;

    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
      log.info("⏰ Прерван таймаут ожидания");
    }

    const maxWaitTime = 100;
    const startTime = Date.now();
    
    while (this.isRunning && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.isRunning) {
      log.warn("⚠️ Принудительная остановка LoopSign (таймаут)");
      this.isRunning = false;
    }

    log.success("✅ LoopSign успешно остановлен");
  }

  get running(): boolean {
    return this.isRunning;
  }
}