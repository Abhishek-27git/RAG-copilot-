"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Loader2,
  AlertTriangle,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import Link from "next/link";

interface Deal {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export default function DealWorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dealId = params.id;

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    data: deal,
    isLoading,
    isError,
    error,
  } = useQuery<Deal>({
    queryKey: ["deal", dealId],
    queryFn: () => api.get(`/deals/${dealId}`),
    enabled: !!dealId,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h3 className="text-base font-semibold">Deal not found</h3>
        <p className="text-sm text-muted-foreground">
          {(error as any)?.message ?? "This workspace does not exist."}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/dashboard">← Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden -m-8">
      {/* Main workspace panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Workspace header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/15 bg-card/5 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-foreground">
                {deal.name}
              </h2>
              {deal.description && (
                <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                  {deal.description}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                deal.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-muted-foreground/10 text-muted-foreground border border-border/40"
              }`}
            >
              {deal.status}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {new Date(deal.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <>
                  <PanelRightClose className="h-3.5 w-3.5" />
                  Hide Documents
                </>
              ) : (
                <>
                  <PanelRightOpen className="h-3.5 w-3.5" />
                  Show Documents
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Workspace content area */}
        <div className="flex flex-1 overflow-y-auto p-8 items-start justify-center">
          <div className="w-full max-w-2xl space-y-6">
            {/* AI Chat placeholder */}
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/40 bg-card/5 py-16 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  AI Analysis Coming Soon
                </h3>
                <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
                  Upload documents using the panel on the right. Once
                  processed, you'll be able to ask questions about your
                  due diligence materials here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document sidebar */}
      {sidebarOpen && (
        <DocumentSidebar
          dealId={dealId}
          dealName={deal.name}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
