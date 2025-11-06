import { Request, Response } from "express";
import { z } from "zod";
import { postScreenshot } from "../../actions";
import { log } from "../../utils";
import { PostScreenShotSchema } from "./dto";

export const createPostScreenshot = async (req: Request, res: Response) => {
    const parsed = PostScreenShotSchema.safeParse(req.body);

     if (!parsed.success) {
        const errors = z.treeifyError(parsed.error);

        return res.status(422).json({
            status: "error",
            message: "Ошибка валидации",
            errors: errors?.properties,
        });
    }

    const { post_url } = parsed.data;
    
    try {
        
        const result = await postScreenshot(post_url);

        if (!result.success) throw new Error("Не удалось создать скриншот");

        res.json({
            ...result
        });

    } catch (error: any) {
        log.error(`❌ Ошибка создания скриншота | Ссылка на пост: ${post_url} | Message: ${JSON.stringify(error)}`);

        res.status(error?.status || 500).json({
            status: "error",
            data: error.data || String(error),
        });
    }
};
