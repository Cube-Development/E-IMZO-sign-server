import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from "zod";
import { ENUM_REGISTER_ROUTE } from '../../utils/swagger/register.enum';

extendZodWithOpenApi(z);

export const SignDocumentSchema = z.object({
  doc_id: z.string().min(1).openapi({
    description: "ID документа для подписи",
    example: "11F07C2E295C694CBEEA3AEFC31432BF"
  }),
  owner: z.union([z.literal(0), z.literal(1)]).openapi({
    description: "Тип владельца документа",
    example: 1

  })
}).openapi(ENUM_REGISTER_ROUTE.SIGN_DOCUMENT_DIDOX);