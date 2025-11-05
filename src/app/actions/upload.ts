'use server';

import { extractDataFromPDF } from '@/services/data-extraction';

interface ProcessResult {
  success: boolean;
  message?: string;
  error?: string;
  files?: Array<{
    name: string;
    size: string;
    type: string;
    extractedText: string;
  }>;
}

interface FileItem {
    file: File;
    id: string;
    name: string;
    size: string;
}

export async function processPDFs(
  _prevState: ProcessResult | null,
  files: FileItem[]
): Promise<ProcessResult> {
  const validFiles = files.filter(({ file }) => file.type === "application/pdf");

  if (validFiles.length === 0) {
    return {
      success: false,
      error: "No valid PDF files found",
    };
  }

  if (validFiles.length !== files.length) {
    return {
      success: false,
      error: `Only ${validFiles.length} out of ${files.length} files are PDFs`,
    };
  }

  try {
    const processFiles = validFiles.map(async (file) => {
      const extractedText = await extractDataFromPDF(file.file);


      return {
        name: file.name,
        size: file.size,
        type: file.file.type,
        extractedText,
      };
    });

    const processedFiles = await Promise.all(processFiles);

    return {
      success: true,
      message: `Successfully processed ${processedFiles.length} PDF file(s)`,
      files: processedFiles,
    };
  } catch (error) {
    console.error("Error processing PDFs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process PDFs",
    };
  }
}
