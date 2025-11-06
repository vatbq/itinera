import { z } from "zod";

export const pdfFormSchema = z.object({
  files: z
    .array(
      z.object({
        file: z.instanceof(File),
        id: z.string(),
        name: z.string(),
        size: z.string(),
        status: z.enum(["ready", "uploading", "success", "error"]),
      }),
    )
    .min(1, { message: "Please select at least one PDF file" })
    .max(10, { message: "You can upload a maximum of 10 files at once" })
    .refine((files) => files.every((f) => f.file.type === "application/pdf"), {
      message: "All files must be PDF documents",
    })
    .refine((files) => files.every((f) => f.file.size <= 10 * 1024 * 1024), {
      message: "Each file must be less than 10MB",
    }),
});

export type PDFFormData = z.infer<typeof pdfFormSchema>;
