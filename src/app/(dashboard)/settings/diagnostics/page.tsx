"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Key,
  Terminal,
  Route,
  Heart,
  FileJson,
} from "lucide-react";

interface DiagnosticData {
  config: {
    baseUrl: string;
    mode: string;
    healthPath: string;
    hasToken: boolean;
    lastStatus: string | null;
    lastLatencyMs: number | null;
  } | null;
  healthResult: {
    status: string;
    mode: string;
    latencyMs?: number;
    version?: string;
    error?: string;
  } | null;
  history: Array<{
    id: string;
    command: string;
    status: string;
    durationMs: number | null;
    createdAt: string;
  }>;
}

const requiredEnvVars = [
  { name: "AUTH_SECRET", description: "NextAuth secret key" },
  { name: "DATABASE_URL", description: "Database connection string" },
  { name: "ENCRYPTION_KEY", description: "Encryption key for tokens" },
  { name: "OPENCLAW_WEBHOOK_SECRET", description: "Webhook verification secret" },
];

const knownCommands = [
  "openclaw.health",
  "repo.scan",
  "md.index",
  "routes.validate",
  "tests.run",
  "wiring.export",
  "task.sync",
];

const knownRoutes = [
  { path: "/api/auth/[...nextauth]", methods: ["GET", "POST"] },
  { path: "/api/auth/register", methods: ["POST"] },
  { path: "/api/boards", methods: ["GET", "POST"] },
  { path: "/api/boards/[boardId]", methods: ["GET", "PUT", "DELETE"] },
  { path: "/api/boards/[boardId]/columns", methods: ["GET", "POST", "PUT"] },
  { path: "/api/boards/[boardId]/columns/[columnId]", methods: ["PUT", "DELETE"] },
  { path: "/api/boards/[boardId]/columns/[columnId]/tasks", methods: ["POST"] },
  { path: "/api/tasks/[taskId]", methods: ["GET", "PUT", "DELETE"] },
  { path: "/api/tasks/[taskId]/move", methods: ["PUT"] },
  { path: "/api/tasks/[taskId]/activity", methods: ["GET"] },
  { path: "/api/command-center/execute", methods: ["POST"] },
  { path: "/api/command-center/history", methods: ["GET"] },
  { path: "/api/openclaw/config", methods: ["GET", "PUT"] },
  { path: "/api/openclaw/health", methods: ["GET"] },
  { path: "/api/openclaw/webhook/job-status", methods: ["POST"] },
];

export default function DiagnosticsPage() {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dbStatus, setDbStatus] = useState<"ok" | "error" | "checking">("checking");

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  async function fetchDiagnostics() {
    setRefreshing(true);
    try {
      // Fetch config, health, and command history in parallel
      const [configRes, healthRes, historyRes] = await Promise.allSettled([
        fetch("/api/openclaw/config"),
        fetch("/api/openclaw/health"),
        fetch("/api/command-center/history?limit=10"),
      ]);

      const config =
        configRes.status === "fulfilled" && configRes.value.ok
          ? await configRes.value.json()
          : null;

      const healthResult =
        healthRes.status === "fulfilled" && healthRes.value.ok
          ? await healthRes.value.json()
          : null;

      const history =
        historyRes.status === "fulfilled" && historyRes.value.ok
          ? await historyRes.value.json()
          : [];

      setDiagnostics({ config, healthResult, history });

      // If any API call worked, DB is ok
      if (config || healthResult || (historyRes.status === "fulfilled" && historyRes.value.ok)) {
        setDbStatus("ok");
      } else {
        setDbStatus("error");
      }
    } catch {
      setDbStatus("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
            <Activity className="h-6 w-6 text-slate-400" />
            Diagnostics
          </h1>
          <p className="mt-1 text-sm text-slate-400">System health and configuration overview</p>
        </div>
        <button
          onClick={fetchDiagnostics}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {/* DB Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Database</h3>
            {dbStatus === "checking" ? (
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-slate-500" />
            ) : dbStatus === "ok" ? (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20">
                <CheckCircle className="h-3 w-3" />
                Connected
              </span>
            ) : (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
                <XCircle className="h-3 w-3" />
                Error
              </span>
            )}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Key className="h-5 w-5 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Environment Variables</h3>
          </div>
          <div className="divide-y divide-slate-800 rounded-lg border border-slate-800">
            {requiredEnvVars.map((env) => (
              <div key={env.name} className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <span className="font-mono text-xs text-slate-300">{env.name}</span>
                  <span className="ml-2 text-xs text-slate-600">{env.description}</span>
                </div>
                {/* We can't check env vars from client - show as "check server" */}
                <span className="text-xs text-slate-500">Server-side</span>
              </div>
            ))}
          </div>
        </div>

        {/* OpenClaw Config */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Terminal className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">OpenClaw Configuration</h3>
          </div>
          {diagnostics?.config ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                <span className="text-xs text-slate-500">Mode</span>
                <p className={`font-medium ${diagnostics.config.mode === "real" ? "text-blue-400" : "text-purple-400"}`}>
                  {diagnostics.config.mode}
                </p>
              </div>
              <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                <span className="text-xs text-slate-500">Base URL</span>
                <p className="font-mono text-xs text-slate-300 truncate">
                  {diagnostics.config.baseUrl || "(not set)"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                <span className="text-xs text-slate-500">Health Path</span>
                <p className="font-mono text-xs text-slate-300">{diagnostics.config.healthPath}</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                <span className="text-xs text-slate-500">Token</span>
                <p className="text-slate-300">{diagnostics.config.hasToken ? "Set" : "Not set"}</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                <span className="text-xs text-slate-500">Last Status</span>
                <p className={`font-medium ${
                  diagnostics.config.lastStatus === "connected"
                    ? "text-green-400"
                    : diagnostics.config.lastStatus === "disconnected"
                    ? "text-red-400"
                    : "text-slate-400"
                }`}>
                  {diagnostics.config.lastStatus || "Unknown"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                <span className="text-xs text-slate-500">Last Latency</span>
                <p className="text-slate-300">
                  {diagnostics.config.lastLatencyMs != null
                    ? `${diagnostics.config.lastLatencyMs}ms`
                    : "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No configuration found</p>
          )}
        </div>

        {/* Health Check */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="h-5 w-5 text-green-400" />
            <h3 className="text-sm font-semibold text-slate-200">Health Check</h3>
          </div>
          {diagnostics?.healthResult ? (
            <div
              className={`rounded-lg border p-3 ${
                diagnostics.healthResult.status === "connected"
                  ? "border-green-500/20 bg-green-500/5"
                  : diagnostics.healthResult.status === "misconfigured"
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {diagnostics.healthResult.status === "connected" ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm font-medium text-slate-300">
                  {diagnostics.healthResult.status} ({diagnostics.healthResult.mode})
                </span>
              </div>
              {diagnostics.healthResult.latencyMs != null && (
                <p className="mt-1 text-xs text-slate-500">
                  Latency: {diagnostics.healthResult.latencyMs}ms
                </p>
              )}
              {diagnostics.healthResult.version && (
                <p className="text-xs text-slate-500">Version: {diagnostics.healthResult.version}</p>
              )}
              {diagnostics.healthResult.error && (
                <p className="mt-1 text-xs text-red-400">{diagnostics.healthResult.error}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Unable to perform health check</p>
          )}
        </div>

        {/* Registered Commands */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Terminal className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Registered Commands</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {knownCommands.map((cmd) => (
              <span
                key={cmd}
                className="inline-flex items-center rounded-md bg-slate-800 px-2.5 py-1 font-mono text-xs text-slate-300 ring-1 ring-slate-700"
              >
                {cmd}
              </span>
            ))}
          </div>
        </div>

        {/* Routes */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Route className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">API Routes</h3>
            <span className="text-xs text-slate-500">({knownRoutes.length} routes)</span>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 rounded-lg border border-slate-800">
            {knownRoutes.map((route) => (
              <div key={route.path} className="flex items-center justify-between px-3 py-2">
                <span className="font-mono text-xs text-slate-300">{route.path}</span>
                <div className="flex gap-1">
                  {route.methods.map((m) => (
                    <span
                      key={m}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        m === "GET"
                          ? "bg-green-500/10 text-green-400"
                          : m === "POST"
                          ? "bg-blue-500/10 text-blue-400"
                          : m === "PUT"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Endpoint Preview */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3 mb-3">
            <FileJson className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Contract Endpoint Preview</h3>
          </div>
          <pre className="max-h-60 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-400">
{JSON.stringify({
  openapi: "3.0.0",
  info: {
    title: "OpenClaw Command Center API",
    version: "0.1.0",
  },
  paths: {
    "/api/command-center/execute": {
      post: {
        summary: "Execute a command",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  command: {
                    type: "string",
                    enum: knownCommands,
                  },
                  params: {
                    type: "object",
                  },
                },
                required: ["command"],
              },
            },
          },
        },
      },
    },
    "/api/openclaw/health": {
      get: {
        summary: "Get OpenClaw health status",
      },
    },
    "/api/openclaw/webhook/job-status": {
      post: {
        summary: "Receive job status updates",
        security: [{ webhookSecret: [] }],
      },
    },
  },
}, null, 2)}
          </pre>
        </div>

        {/* Recent Command History */}
        {diagnostics?.history && diagnostics.history.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Activity className="h-4 w-4 text-slate-400" />
              Recent Commands
            </h3>
            <div className="divide-y divide-slate-800 rounded-lg border border-slate-800">
              {diagnostics.history.map((h) => (
                <div key={h.id} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        h.status === "success" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="font-mono text-xs text-slate-300">{h.command}</span>
                    {h.durationMs != null && (
                      <span className="text-[10px] text-slate-600">{h.durationMs}ms</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600">
                    {new Date(h.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
