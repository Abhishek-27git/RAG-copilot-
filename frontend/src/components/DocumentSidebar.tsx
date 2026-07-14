"use client";

import React, { useCallback, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────────────────

export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

export interface DocumentRecord {
  id: string;
  deal_id: string;
  filename: string;
  file_type: string;
  status: DocumentStatus;
  storage_path: string;
  error_message: string | null;
  created_at: string;
}

interface DocumentSidebarProps {
  dealId: string;
  dealName: string;
  onClose?: () => void;
}

// ─── Helper functions ────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["pdf", "docx", "xlsx"];
const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function getFileExt(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function FileTypeIcon({ ext, className }: { ext: string; className?: string }) {
  if (ext === "pdf")
    return <FileText className={cn("text-red-400", className)} />;
  if (ext === "xlsx")
    return <FileSpreadsheet className={cn("text-emerald-400", className)} />;
  return <File className={cn("text-blue-400", className)} />;
}

function StatusBadge({ status, errorMessage }: { status: DocumentStatus; errorMessage: string | null }) {
  const map: Record<DocumentStatus, { icon: React.ReactNode; label: string; cls: string }> = {
    pending: {
      icon: <Clock className="h-3 w-3" />,
      label: "Pending",
      cls: "text-muted-foreground bg-muted/30 border-border/30",
    },
    processing: {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: "Processing",
      cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    ready: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Ready",
      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    failed: {
      icon: <XCircle className="h-3 w-3" />,
      label: "Failed",
      cls: "text-destructive bg-destructive/10 border-destructive/20",
    },
  };

  const { icon, label, cls } = map[status];

  return (
    <span
      title={status === "failed" && errorMessage ? errorMessage : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        cls
      )}
    >
      {icon}
      {label}
    </span>
  );
}

// ─── Per-document polling hook ───────────────────────────────────────────────

function useDocumentStatusPoll(
  dealId: string,
  docId: string,
  enabled: boolean
) {
  return useQuery<{ id: string; status: DocumentStatus; error_message: string | null }>({
    queryKey: ["document-status", docId],
    queryFn: () => api.get(`/deals/${dealId}/documents/${docId}/status`),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "processing" ? 2000 : false;
    },
    staleTime: 0,
  });
}

// ─── Single document row ──────────────────────────────────────────────────────

function DocumentRow({
  doc,
  dealId,
}: {
  doc: DocumentRecord;
  dealId: string;
}) {
  const needsPoll = doc.status === "pending" || doc.status === "processing";
  const { data: polled } = useDocumentStatusPoll(dealId, doc.id, needsPoll);

  const currentStatus = (polled?.status ?? doc.status) as DocumentStatus;
  const currentError = polled?.error_message ?? doc.error_message;
  const ext = getFileExt(doc.filename);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/20 bg-card/10 px-3 py-2.5 transition-colors hover:bg-card/20">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/30 border border-border/20">
        <FileTypeIcon ext={ext} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-xs font-medium text-foreground"
          title={doc.filename}
        >
          {doc.filename}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wide">
          {ext} · {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
      <StatusBadge status={currentStatus} errorMessage={currentError} />
    </div>
  );
}

// ─── Drop zone ───────────────────────────────────────────────────────────────

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ALLOWED_MIME.includes(f.type)
      );
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = "";
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all",
        dragOver
          ? "border-primary/50 bg-primary/5"
          : "border-border/30 hover:border-primary/30 hover:bg-card/10"
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
        <Upload className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium text-foreground">
          Drop files or click to upload
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          PDF, DOCX, XLSX — max 50 MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.xlsx"
        className="sr-only"
        onChange={handleChange}
      />
    </button>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function DocumentSidebar({ dealId, dealName, onClose }: DocumentSidebarProps) {
  const queryClient = useQueryClient();
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  // List all documents for this deal
  const { data: documents = [], isLoading } = useQuery<DocumentRecord[]>({
    queryKey: ["documents", dealId],
    queryFn: () => api.get(`/deals/${dealId}/documents`),
    staleTime: 5000,
  });

  // Upload mutation — one file at a time (sequential to avoid race conditions)
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deals/${dealId}/documents`,
        {
          method: "POST",
          body: form,
          credentials: "include",
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail ?? "Upload failed");
      }
      return response.json() as Promise<DocumentRecord>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", dealId] });
    },
    onError: (err: Error) => {
      setUploadErrors((prev) => [...prev, err.message]);
    },
  });

  const handleFiles = async (files: File[]) => {
    setUploadErrors([]);
    const invalid = files.filter((f) => !ALLOWED_TYPES.includes(getFileExt(f.name)));
    if (invalid.length) {
      setUploadErrors([`Unsupported file type(s): ${invalid.map((f) => f.name).join(", ")}`]);
    }
    const valid = files.filter((f) => ALLOWED_TYPES.includes(getFileExt(f.name)));
    for (const file of valid) {
      await uploadMutation.mutateAsync(file);
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className="flex h-full w-[320px] flex-col border-l border-border/20 bg-card/10 backdrop-blur-md">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/15 px-4">
        <div>
          <p className="text-xs font-bold text-foreground">Documents</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={dealName}>
            {dealName}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Upload zone */}
      <div className="shrink-0 p-3 border-b border-border/10">
        {isUploading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/20 bg-card/10 py-5">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Uploading…</span>
          </div>
        ) : (
          <DropZone onFiles={handleFiles} />
        )}

        {/* Upload errors */}
        {uploadErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            {uploadErrors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-1.5"
              >
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                <p className="text-[10px] text-destructive">{err}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-14 rounded-lg border border-border/20 bg-muted/10 animate-pulse"
              />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No documents yet</p>
            <p className="text-[10px] text-muted-foreground/70">
              Upload PDF, DOCX, or XLSX files above
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} dealId={dealId} />
          ))
        )}
      </div>

      {/* Footer stats */}
      {documents.length > 0 && (
        <div className="shrink-0 border-t border-border/10 px-4 py-2.5">
          <p className="text-[10px] text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? "s" : ""} ·{" "}
            {documents.filter((d) => d.status === "ready").length} ready
          </p>
        </div>
      )}
    </div>
  );
}
