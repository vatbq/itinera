"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { processPDFs } from "@/app/actions/upload";
import { PDFDropzone } from "@/components/pdf-dropzone";
import { pdfFormSchema, type PDFFormData } from "@/schemas/pdf";

export function PDFUploadForm() {
  const [state, formAction, isPending] = useActionState(processPDFs, null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const { control, getValues } = useForm<PDFFormData>({
    resolver: zodResolver(pdfFormSchema),
    defaultValues: {
      files: [],
    },
  });

  useEffect(() => {
    if (state?.success && state.runId) {
      router.push(`/workflow/${state.runId}`);
    }
  }, [state, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { files } = getValues();

    if (!files || files.length === 0) {
      return;
    }

    startTransition(() => {
      formAction(files);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Controller
        name="files"
        control={control}
        render={({ field, fieldState }) => (
          <PDFDropzone
            value={field.value}
            onChange={(files) => {
              field.onChange(files);
            }}
            isLoading={isPending}
            error={fieldState.error?.message}
          />
        )}
      />

      {state && !state.success && (
        <div className="rounded-lg p-4 text-sm bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </div>
      )}
    </form>
  );
}
