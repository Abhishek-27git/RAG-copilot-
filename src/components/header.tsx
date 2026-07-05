"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/documents": "Documents",
  "/upload": "Upload Documents",
};

/**
 * Top header bar with dynamic page title.
 */
export function Header(): React.ReactElement {
  const pathname = usePathname();

  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-border bg-card/50 px-6 backdrop-blur-sm">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">
            Online
          </span>
        </div>
      </div>
    </header>
  );
}
