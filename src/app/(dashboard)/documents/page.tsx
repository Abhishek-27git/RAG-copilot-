import { FileText, Upload, Search } from "lucide-react";

/**
 * Documents listing page (UI only).
 * Shows an empty state with a CTA to upload documents.
 * Backend wiring will be added in Phase 2.
 */
export default function DocumentsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and view your uploaded deal documents
          </p>
        </div>
        <a
          href="/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-violet-700"
        >
          <Upload className="h-4 w-4" />
          Upload
        </a>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search documents..."
          disabled
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Table header */}
      <div className="rounded-xl border border-border/50 bg-card">
        <div className="border-b border-border/50 px-6 py-3">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5">Document</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-3">Uploaded</div>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
            <FileText className="h-8 w-8 text-indigo-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            No documents yet
          </h3>
          <p className="mt-1.5 max-w-sm text-center text-sm text-muted-foreground">
            Upload your first document to start analyzing deal data with
            AI-powered insights and citations.
          </p>
          <a
            href="/upload"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-violet-700"
          >
            <Upload className="h-4 w-4" />
            Upload your first document
          </a>
        </div>
      </div>
    </div>
  );
}
