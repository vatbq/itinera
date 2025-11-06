"use server";

import { createItinerary } from "@/workflows/create-itinerary";
import { start } from "workflow/api";

interface ProcessResult {
  success: boolean;
  message?: string;
  error?: string;
  runId?: string;
  files?: Array<{
    name: string;
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
  files: FileItem[],
): Promise<ProcessResult> {
  const validFiles = files.filter(
    ({ file }) => file.type === "application/pdf",
  );

  if (validFiles.length === 0) {
    return { success: false, error: "No valid PDF files found" };
  }

  if (validFiles.length !== files.length) {
    return {
      success: false,
      error: `Only ${validFiles.length} out of ${files.length} files are PDFs`,
    };
  }

  try {
    const fileDataPromises = validFiles.map(async (item) => {
      const arrayBuffer = await item.file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return {
        name: item.name,
        content: base64,
      };
    });

    const fileData = await Promise.all(fileDataPromises);

    const run = await start(createItinerary, [fileData]);

    return {
      success: true,
      message: `Started processing ${fileData.length} PDF file(s)`,
      runId: run.runId,
    };
  } catch (error) {
    console.error("Error processing PDFs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process PDFs",
    };
  }
}
