import { PDFUploadForm } from "@/components/pdf-upload-form";

export async function PDFUploadSection() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 sm:p-8 shadow-sm">
      <PDFUploadForm />
    </div>
  );
}
