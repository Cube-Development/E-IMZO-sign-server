import rateLimit from "express-rate-limit";
import { MAX_SCREENSHOT_LIMIT } from "../../config";

export const screenshotLimiter = rateLimit({
  windowMs: 1000,
  max: MAX_SCREENSHOT_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: `Слишком много запросов на скриншоты. Макс. ${MAX_SCREENSHOT_LIMIT} RPS.`,
  },
});
