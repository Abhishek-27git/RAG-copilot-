"use client";

import React, { useState } from "react";
import { CitationItem } from "@/lib/chat";
import {
  FileText,
  X,
  Copy,
  Check,
  BookOpen,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SourceViewerProps {
  citation: CitationItem | null;
  onClose: () => void;
}

export function SourceViewer({ citation, onClose }: SourceViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.source_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full w-[360px] flex-col border-l border-border/20 bg-card/15 backdrop-blur-md transition-all animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/15 px-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-foreground truncate">
              Source Citation
            </h3>
            <p className="text-[10px] text-muted-foreground truncate">
              {citation.filename}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/20 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Metadata Badges */}
      <div className="flex items-center gap-2 p-3 border-b border-border/10 bg-card/5">
        <div className="flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
          <FileText className="h-3 w-3" />
          <span>Page {citation.page_number}</span>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border/30 bg-muted/20 px-2 py-1 text-[11px] font-medium text-muted-foreground">
          <Layers className="h-3 w-3" />
          <span>Chunk #{citation.chunk_index}</span>
        </div>
      </div>

      {/* Source Passage Text */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Cited Passage
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy Passage</span>
              </>
            )}
          </Button>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs font-mono leading-relaxed text-foreground/90 whitespace-pre-wrap shadow-inner selection:bg-amber-500/30">
          <mark className="bg-amber-500/20 text-amber-200 px-0.5 py-0.5 rounded border-b border-amber-400/40 font-mono">
            {citation.source_text}
          </mark>
        </div>
      </div>

      {/* Footer Info */}
      <div className="shrink-0 border-t border-border/15 p-3 bg-card/5 text-[10px] text-muted-foreground flex items-center justify-between">
        <span>Doc ID: {citation.document_id.slice(0, 8)}...</span>
        <span className="text-primary/80 font-medium">Sub-passage verified</span>
      </div>
    </div>
  );
}
