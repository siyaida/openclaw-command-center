"use client";

import type { ConnectionStatus, OpenClawMode } from "@/lib/openclaw/types";

interface ConnectionBadgeProps {
  status: ConnectionStatus;
  mode: OpenClawMode;
  latencyMs?: number;
  version?: string;
  error?: string;
}

export function ConnectionBadge({ status, mode, latencyMs, version, error }: ConnectionBadgeProps) {
  const config = {
    connected: {
      dot: "bg-green-500",
      text: "Connected",
      textColor: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    disconnected: {
      dot: "bg-red-500",
      text: "Not Connected",
      textColor: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
    misconfigured: {
      dot: "bg-amber-500",
      text: "Misconfigured",
      textColor: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  };

  const c = config[status];

  return (
    <div className={`rounded-lg border p-3 ${c.bg}`}>
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.dot} ${status === "connected" ? "animate-pulse-dot" : ""}`} />
        <span className={`text-sm font-medium ${c.textColor}`}>{c.text}</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          {mode}
        </span>
      </div>
      {(latencyMs !== undefined || version) && (
        <div className="mt-1.5 flex gap-3 text-[11px] text-slate-500">
          {latencyMs !== undefined && <span>{latencyMs}ms latency</span>}
          {version && <span>v{version}</span>}
        </div>
      )}
      {error && (
        <p className="mt-1.5 text-[11px] text-red-400/80">{error}</p>
      )}
    </div>
  );
}
