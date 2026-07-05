import {
  FileText,
  Upload,
  TrendingUp,
  Clock,
} from "lucide-react";

interface StatCard {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

const STATS: StatCard[] = [
  {
    title: "Total Documents",
    value: "0",
    description: "Upload documents to get started",
    icon: FileText,
    gradient: "from-indigo-500/20 to-violet-500/20",
  },
  {
    title: "Processing",
    value: "0",
    description: "Documents being analyzed",
    icon: Clock,
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    title: "Ready for Query",
    value: "0",
    description: "Documents ready for AI queries",
    icon: TrendingUp,
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "Uploads Today",
    value: "0",
    description: "Documents uploaded today",
    icon: Upload,
    gradient: "from-rose-500/20 to-pink-500/20",
  },
];

/**
 * Dashboard home page.
 * Shows stats cards and a welcome message.
 */
export default function DashboardPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to DD Copilot
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your AI-powered due diligence assistant. Upload deal documents and get
          answers grounded in your data.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:border-border hover:shadow-md"
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <Icon className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">Quick Start</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by uploading your first document
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-violet-700 hover:shadow-xl hover:shadow-indigo-500/30"
          >
            <Upload className="h-4 w-4" />
            Upload Documents
          </a>
          <a
            href="/documents"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
          >
            <FileText className="h-4 w-4" />
            View Documents
          </a>
        </div>
      </div>
    </div>
  );
}
