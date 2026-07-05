"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedFile {
  file: File;
  id: string;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];

/**
 * Upload page (UI only).
 * Drag-and-drop zone with file list preview.
 * No backend wiring — upload button shows a "Coming in Phase 2" message.
 */
export default function UploadPage(): React.ReactElement {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState("");

  const addFiles = useCallback((fileList: FileList | null): void => {
    if (!fileList) return;

    const newFiles: SelectedFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (ACCEPTED_TYPES.includes(file.type)) {
        newFiles.push({ file, id: `${Date.now()}-${i}` });
      }
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const removeFile = useCallback((id: string): void => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleUpload = (): void => {
    setNotice("Upload functionality will be available in Phase 2.");
    setTimeout(() => setNotice(""), 4000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Upload Documents
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload deal documents for AI-powered analysis. Supported formats: PDF,
          DOCX, DOC, TXT.
        </p>
      </div>

      {/* Notice */}
      {notice && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-300",
          dragOver
            ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
            : "border-border/50 bg-card hover:border-border hover:bg-accent/30"
        )}
      >
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
            dragOver
              ? "bg-indigo-500/20 scale-110"
              : "bg-gradient-to-br from-indigo-500/10 to-violet-500/10"
          )}
        >
          <Upload
            className={cn(
              "h-8 w-8 transition-colors",
              dragOver ? "text-indigo-400" : "text-muted-foreground"
            )}
          />
        </div>

        <p className="mt-4 text-base font-semibold text-foreground">
          {dragOver ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          or click to browse from your computer
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {ACCEPTED_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="rounded-full border border-border/50 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {ext.toUpperCase()}
            </span>
          ))}
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={(e) => addFiles(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Select files to upload"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Selected Files ({files.length})
            </h3>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {files.map(({ file, id }) => (
              <div
                key={id}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 transition-all hover:border-border"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                  <FileText className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1 truncate">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Upload button */}
          <button
            type="button"
            onClick={handleUpload}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-violet-700"
          >
            <Upload className="h-4 w-4" />
            Upload {files.length} {files.length === 1 ? "file" : "files"}
          </button>
        </div>
      )}
    </div>
  );
}
