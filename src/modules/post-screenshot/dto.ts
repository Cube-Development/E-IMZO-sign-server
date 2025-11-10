import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from "zod";
import { ENUM_REGISTER_ROUTE } from '../../utils/swagger/register.enum';

extendZodWithOpenApi(z);

export const PostScreenShotSchema = z.object({
  post_url: z.string()
    .min(1)
    .regex(/^https:\/\/t\.me\//, "URL должен начинаться с https://t.me/")
    .openapi({
      description: "URL для скриншота",
      example: "https://t.me/ru2ch/157446"
    }),
}).openapi(ENUM_REGISTER_ROUTE.POST_SCREENSHOT);