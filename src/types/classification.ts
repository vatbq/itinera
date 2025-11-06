import { z } from "zod";

export const DocTypeSchema = z.enum(["hotel", "flight", "car"]);

export type DocType = z.infer<typeof DocTypeSchema>;

export const ClassificationResultSchema = z.object({
  doc_type: DocTypeSchema,
  confidence: z.number().min(0).max(1),
});

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;
