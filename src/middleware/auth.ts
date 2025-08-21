// middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { SERVER_API_KEY } from "../config";

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey || apiKey !== SERVER_API_KEY) {
        return res.status(401).json({
            status: "error",
            message: "Неверный API ключ"
        });
    }
    
    next();
};