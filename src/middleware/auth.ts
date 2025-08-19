// middleware/auth.ts
import { Request, Response, NextFunction } from "express";

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({
            status: "error",
            message: "Неверный API ключ"
        });
    }
    
    next();
};