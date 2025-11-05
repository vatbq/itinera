'use server';

import { revalidatePath } from 'next/cache';

export async function uploadPDFs(formData: FormData) {
  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return {
      success: false,
      error: 'No files provided',
    };
  }

  const validFiles = files.filter((file) => file.type === 'application/pdf');

  if (validFiles.length === 0) {
    return {
      success: false,
      error: 'No valid PDF files found',
    };
  }

  if (validFiles.length !== files.length) {
    return {
      success: false,
      error: `Only ${validFiles.length} out of ${files.length} files are PDFs`,
    };
  }

  const processedFiles = validFiles.map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
  }));

  // TODO: Process the PDF files here
  console.log('Files ready for processing:', processedFiles);

  revalidatePath('/');

  return {
    success: true,
    files: processedFiles,
    message: `${validFiles.length} PDF file(s) ready to process`,
  };
}
