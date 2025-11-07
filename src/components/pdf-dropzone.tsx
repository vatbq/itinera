"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";
import { PDFFileList } from "@/components/pdf-file-list";

export interface PDFFile {
  file: File;
  id: string;
  name: string;
  size: string;
  status: "ready" | "uploading" | "success" | "error";
}

interface PDFDropzoneProps {
  value?: PDFFile[];
  onChange?: (files: PDFFile[]) => void;
  isLoading?: boolean;
  error?: string;
}

export function PDFDropzone({
  value = [],
  onChange,
  isLoading = false,
  error,
}: PDFDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (filesToAdd: File[]) => {
    const pdfFiles = filesToAdd.filter(
      (file) => file.type === "application/pdf",
    );

    if (pdfFiles.length === 0) {
      alert("Please select PDF files only");
      return;
    }

    const newFiles: PDFFile[] = pdfFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      size: formatFileSize(file.size),
      status: "ready" as const,
    }));

    onChange?.([...value, ...newFiles]);
  };

  const removeFile = (id: string) => {
    const updatedFiles = value.filter((f) => f.id !== id);
    onChange?.(updatedFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/50",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 sm:py-16">
          <FileUp
            className={cn(
              "size-10 transition-colors",
              isDragActive ? "text-primary" : "text-muted-foreground",
            )}
          />
          <div className="text-center">
            <p className="font-semibold text-foreground">
              Drag and drop your PDF files here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to select files from your computer
            </p>
          </div>
        </div>
      </div>

      <PDFFileList files={value} onRemove={removeFile} isLoading={isLoading} />

      {value.length > 0 && (
        <div className="mt-4 flex justify-between gap-2 pt-4 border-t">
          <Button
            type="button"
            onClick={() => onChange?.([])}
            variant="outline"
            disabled={isLoading}
          >
            Clear All
          </Button>
          <Button
            type="submit"
            variant="outline"
            disabled={value.length === 0 || isLoading}
          >
            {isLoading
              ? "Processing..."
              : "Generate Itinerary"}
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg p-3 text-sm bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
