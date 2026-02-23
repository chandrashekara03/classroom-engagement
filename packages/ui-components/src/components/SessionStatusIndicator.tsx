import * as React from "react"
import { cn } from "../lib/utils"
import { SessionStatus } from "@classroom/shared-utils"

interface SessionStatusIndicatorProps {
  status: SessionStatus;
  className?: string;
}

export function SessionStatusIndicator({ status, className }: SessionStatusIndicatorProps) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    SCHEDULED: { color: "bg-amber-100 text-amber-700", label: "Scheduled" },
    LIVE: { color: "bg-emerald-100 text-emerald-700 animate-pulse", label: "Live" },
    COMPLETED: { color: "bg-slate-100 text-slate-700", label: "Completed" },
    PAIRING: { color: "bg-blue-100 text-blue-700", label: "Pairing" },
    PAUSED: { color: "bg-slate-100 text-slate-700", label: "Paused" },
  };

  const config = statusConfig[status || 'WAITING'] || { color: "bg-slate-100 text-slate-700", label: status || "Unknown" };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      config.color,
      className
    )}>
      {config.label}
    </span>
  );
}
