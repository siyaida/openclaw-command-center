"use client";

import { useState, useEffect } from "react";
import {
  Terminal,
  Send,
  Heart,
  FolderSearch,
  FileText,
  Route,
  TestTube,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Download,
  Shield,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { ConnectionBadge } from "./connection-badge";
import { OutputConsole, type ConsoleEntry } from "./output-console";
import type { OpenClawStatus } from "@/lib/openclaw/types";

interface CommandCenterPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

const presetCommands = [
  { command: "openclaw.health", label: "Health", icon: Heart, color: "text-green-400" },
  { command: "repo.scan", label: "Repo Scan", icon: FolderSearch, color: "text-blue-400" },
  { command: "md.index", label: "MD Index", icon: FileText, color: "text-cyan-400" },
  { command: "routes.validate", label: "Validate Routes", icon: Route, color: "text-amber-400" },
  { command: "tests.run", label: "Run Tests", icon: TestTube, color: "text-purple-400" },
  { command: "wiring.export", label: "Export Wiring", icon: Package, color: "text-orange-400" },
  { command: "task.sync", label: "Sync Tasks", icon: RefreshCw, color: "text-teal-400" },
];

export function CommandCenterPanel({ collapsed, onToggle }: CommandCenterPanelProps) {
  const [status, setStatus] = useState<OpenClawStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [commandInput, setCommandInput] = useState("");
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [executing, setExecuting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; command: string; status: string; createdAt: string }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/openclaw/health");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setStatus({ status: "disconnected", mode: "mock", error: "Failed to fetch status" });
      }
    } catch {
      setStatus({ status: "disconnected", mode: "mock", error: "Network error" });
    } finally {
      setLoadingStatus(false);
    }
  }

  async function executeCommand(command: string) {
    setExecuting(true);

    try {
      const res = await fetch("/api/command-center/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, params: {} }),
      });

      const data = await res.json();

      const entry: ConsoleEntry = {
        id: `${Date.now()}-${Math.random()}`,
        command,
        timestamp: new Date().toISOString(),
        success: data.success ?? res.ok,
        data: data.data,
        error: data.error,
        durationMs: data.durationMs ?? 0,
      };

      setEntries((prev) => [...prev, entry]);

      // Handle wiring export download redirect
      if (command === "wiring.export" && data.success && data.data?.redirect) {
        window.open(data.data.redirect, "_blank");
      }
    } catch {
      const entry: ConsoleEntry = {
        id: `${Date.now()}-${Math.random()}`,
        command,
        timestamp: new Date().toISOString(),
        success: false,
        error: "Network error executing command",
        durationMs: 0,
      };
      setEntries((prev) => [...prev, entry]);
    } finally {
      setExecuting(false);
    }
  }

  async function handleCustomCommand(e: React.FormEvent) {
    e.preventDefault();
    if (!commandInput.trim() || executing) return;

    const cmd = commandInput.trim();
    setCommandInput("");

    // Check if it matches a known command
    const valid = presetCommands.find((p) => p.command === cmd);
    if (valid) {
      await executeCommand(cmd);
    } else {
      const entry: ConsoleEntry = {
        id: `${Date.now()}-${Math.random()}`,
        command: cmd,
        timestamp: new Date().toISOString(),
        success: false,
        error: `Unknown command: "${cmd}". Available: ${presetCommands.map((p) => p.command).join(", ")}`,
        durationMs: 0,
      };
      setEntries((prev) => [...prev, entry]);
    }
  }

  async function toggleHistory() {
    if (!showHistory && history.length === 0) {
      setLoadingHistory(true);
      try {
        const res = await fetch("/api/command-center/history?limit=20");
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingHistory(false);
      }
    }
    setShowHistory(!showHistory);
  }

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-16 z-10 flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm text-purple-400 transition-colors hover:bg-purple-500/20"
      >
        <PanelRightOpen className="h-4 w-4" />
        Command Center
      </button>
    );
  }

  return (
    <div className="flex w-[400px] shrink-0 flex-col border-l border-slate-800 bg-slate-900/50">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-200">Command Center</h3>
        </div>
        <button
          onClick={onToggle}
          className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Connection Status */}
        {loadingStatus ? (
          <div className="flex items-center justify-center rounded-lg border border-slate-700 p-4">
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          </div>
        ) : status ? (
          <ConnectionBadge
            status={status.status}
            mode={status.mode}
            latencyMs={status.latencyMs}
            version={status.version}
            error={status.error}
          />
        ) : null}

        {/* Command Input */}
        <form onSubmit={handleCustomCommand} className="flex gap-2">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type a command..."
            disabled={executing}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={executing || !commandInput.trim()}
            className="rounded-lg bg-purple-500 px-3 py-2 text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
          >
            {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>

        {/* Preset Commands */}
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Quick Commands
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {presetCommands.map((preset) => (
              <button
                key={preset.command}
                onClick={() => executeCommand(preset.command)}
                disabled={executing}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <preset.icon className={`h-3.5 w-3.5 ${preset.color}`} />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Special Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => executeCommand("routes.validate")}
            disabled={executing}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
          >
            <Shield className="h-3.5 w-3.5" />
            Run Self-Audit
          </button>
          <button
            onClick={() => executeCommand("wiring.export")}
            disabled={executing}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 py-2 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/20 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Wiring Pack
          </button>
        </div>

        {/* Output Console */}
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Output
          </p>
          <OutputConsole entries={entries} />
        </div>

        {/* Command History */}
        <div>
          <button
            onClick={toggleHistory}
            className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800"
          >
            <span>Command History</span>
            {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showHistory && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/30">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                </div>
              ) : history.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-500">No history</div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            h.status === "success" ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-xs font-mono text-slate-300">{h.command}</span>
                      </div>
                      <span className="text-[10px] text-slate-600">
                        {new Date(h.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
