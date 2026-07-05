import { Shield } from "lucide-react";

interface LogoProps {
  collapsed?: boolean;
}

/**
 * App logo/branding component.
 * Shows icon + text when expanded, icon only when collapsed.
 */
export function Logo({ collapsed = false }: LogoProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
        <Shield className="h-5 w-5 text-white" />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
            DD Copilot
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
            Due Diligence AI
          </span>
        </div>
      )}
    </div>
  );
}
