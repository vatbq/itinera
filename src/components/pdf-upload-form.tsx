'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { uploadPDFs } from '@/app/actions/upload';
import { PDFDropzone } from '@/components/pdf-dropzone';
import { pdfFormSchema, type PDFFormData } from '@/schemas/pdf';

export function PDFUploadForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PDFFormData>({
    resolver: zodResolver(pdfFormSchema),
    defaultValues: {
      files: [],
    },
  });

  const isLoading = isSubmitting || isPending;

  const onSubmit = handleSubmit(async (data) => {
    setResult(null);

    try {
      const formData = new FormData();
      data.files.forEach((pdfFile) => {
        formData.append('files', pdfFile.file);
      });

      startTransition(async () => {
        const response = await uploadPDFs(formData);

        setResult({
          success: response.success,
          message: response.message || response.error,
          error: response.error,
        });

        if (response.success) {
          reset();
        }
      });
    } catch {
      setResult({
        success: false,
        error: 'An error occurred while uploading files',
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Controller
        name="files"
        control={control}
        render={({ field, fieldState }) => (
          <PDFDropzone
            value={field.value}
            onChange={(files) => {
              field.onChange(files);

              if (result) {
                setResult(null);
              }
            }}
            isLoading={isLoading}
            onUpload={onSubmit}
            error={fieldState.error?.message}
          />
        )}
      />

      {result && (
        <div
          className={`rounded-lg p-4 text-sm ${
            result.success
              ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
          }`}
        >
          {result.message || result.error}
        </div>
      )}
    </form>
  );
}
