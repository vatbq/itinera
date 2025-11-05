'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useActionState, useTransition } from 'react';
import { processPDFs } from '@/app/actions/upload';
import { PDFDropzone } from '@/components/pdf-dropzone';
import { pdfFormSchema, type PDFFormData } from '@/schemas/pdf';

export function PDFUploadForm() {
  const [state, formAction, isPending] = useActionState(processPDFs, null);
  const [, startTransition] = useTransition();

  const {
    control,
    getValues,
  } = useForm<PDFFormData>({
    resolver: zodResolver(pdfFormSchema),
    defaultValues: {
      files: [],
    },
  });

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

      {state && (
        <div
          className={`rounded-lg p-4 text-sm ${
            state.success
              ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
          }`}
        >
          {state.message || state.error}
        </div>
      )}
    </form>
  );
}
