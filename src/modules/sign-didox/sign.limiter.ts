import rateLimit from "express-rate-limit";
import { MAX_SIGN_LIMIT } from "../../config";

export const signLimiter = rateLimit({
  windowMs: 1000,
  max: MAX_SIGN_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: `Слишком много запросов. Макс. ${MAX_SIGN_LIMIT} RPS. Повторите позже.`,
  },
});