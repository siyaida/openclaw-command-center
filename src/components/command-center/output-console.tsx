"use client";

import { useRef, useEffect } from "react";
import { Terminal, Clock, CheckCircle, XCircle } from "lucide-react";

export interface ConsoleEntry {
  id: string;
  command: string;
  timestamp: string;
  success: boolean;
  data?: unknown;
  error?: string;
  durationMs: number;
}

interface OutputConsoleProps {
  entries: ConsoleEntry[];
}

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function OutputConsole({ entries }: OutputConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-950 py-8">
        <Terminal className="mb-2 h-8 w-8 text-slate-700" />
        <p className="text-xs text-slate-600">No commands executed yet</p>
        <p className="text-[10px] text-slate-700">Run a command to see output here</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="max-h-80 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 font-mono text-xs"
    >
      {entries.map((entry) => (
        <div key={entry.id} className="border-b border-slate-800/50 px-3 py-2.5 last:border-0">
          <div className="mb-1 flex items-center gap-2">
            {entry.success ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <XCircle className="h-3 w-3 text-red-500" />
            )}
            <span className="font-semibold text-blue-400">{entry.command}</span>
            <span className="flex items-center gap-0.5 text-slate-600">
              <Clock className="h-2.5 w-2.5" />
              {entry.durationMs}ms
            </span>
            <span className="ml-auto text-slate-700">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
          </div>
          {entry.error ? (
            <div className="mt-1 text-red-400/80">{String(entry.error)}</div>
          ) : null}
          {entry.data != null ? (
            <pre className="mt-1 whitespace-pre-wrap break-all text-slate-400 leading-relaxed">
              {formatJson(entry.data)}
            </pre>
          ) : null}
        </div>
      ))}
    </div>
  );
}
