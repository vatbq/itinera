"use client";

import { FileUp, FileX, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PDFFile } from "@/components/pdf-dropzone";

interface PDFFileListProps {
  files: PDFFile[];
  onRemove: (id: string) => void;
  isLoading?: boolean;
}

export function PDFFileList({
  files,
  onRemove,
  isLoading = false,
}: PDFFileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-medium text-foreground">
        Selected Files ({files.length})
      </h3>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
              file.status === "ready" && "border-border bg-card",
              file.status === "uploading" && "border-primary/50 bg-primary/5",
              file.status === "success" &&
                "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950",
              file.status === "error" &&
                "border-destructive/50 bg-destructive/5",
            )}
          >
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <FileUp className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">{file.size}</p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              {file.status === "uploading" && (
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
              {file.status === "success" && (
                <Check className="size-4 text-green-600 dark:text-green-400" />
              )}
              {file.status === "error" && (
                <FileX className="size-4 text-destructive" />
              )}
              {file.status === "ready" && (
                <button
                  type="button"
                  onClick={() => onRemove(file.id)}
                  disabled={isLoading}
                  className={cn(
                    "p-1 rounded hover:bg-background transition-colors",
                    isLoading && "opacity-50 cursor-not-allowed",
                  )}
                  aria-label="Remove file"
                >
                  <FileX className="size-4 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
