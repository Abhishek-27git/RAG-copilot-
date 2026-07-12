"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pageTitle = pathname === "/dashboard" ? "Dashboard" : "Workspace";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <aside className="relative flex h-full w-[260px] flex-col border-r border-border/20 bg-card/20 backdrop-blur-md">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-border/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">
            DD Copilot
          </span>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 space-y-1 px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile drawer */}
        <div className="border-t border-border/15 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/20 border border-border/5 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-xs uppercase">
              {user.name.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {user.name}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/20 bg-card/15 px-8 backdrop-blur-md">
          <h1 className="text-sm font-bold text-foreground tracking-tight">{pageTitle}</h1>
          <div className="flex items-center gap-2 rounded-full border border-border/20 bg-muted/30 px-3 py-1.5 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Connected
            </span>
          </div>
        </header>

        {/* Scrollable workspace content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
