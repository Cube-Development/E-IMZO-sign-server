import { Request, Response } from "express";
import { z } from "zod";
import { eImzo } from "../..";
import { signDocument } from "../../actions";
import { log } from "../../utils";
import { SignDocumentSchema } from "./dto";

export const createSignDocument = async (req: Request, res: Response) => {
    const parsed = SignDocumentSchema.safeParse(req.body);

     if (!parsed.success) {
        const errors = z.treeifyError(parsed.error);

        return res.status(422).json({
            status: "error",
            message: "Ошибка валидации",
            errors: errors?.properties,
        });
    }

    const { doc_id, owner } = parsed.data;
    
    try {
        
        const ws = eImzo.getWs();
        const keyId = eImzo.getKeyId();
        const result = await signDocument(doc_id, owner, ws, keyId);

        if (!result.success) throw new Error("Не удалось подписать документ");

        res.json({
            status: "success",
            message: "Документ подписан!",
            data: req.body
        });

    } catch (error: any) {
        log.error(`❌ Ошибка подписания документа | Document ID: ${doc_id} | Owner: ${owner} | Message: ${error}`);

        res.status(error?.status || 500).json({
            status: "error",
            data: error.data || String(error),
        });
    }
};
