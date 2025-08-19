import { z } from "zod";

export const SignDocumentSchema = z.object({
  doc_id: z.string().min(1, "doc_id is required"),
    owner: z.union([z.literal(0), z.literal(1)]).refine(() => true, {
    message: "owner must be 0 or 1",
    })
});