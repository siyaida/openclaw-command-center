"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Terminal,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";

interface OpenClawConfig {
  baseUrl: string;
  mode: string;
  healthPath: string;
  hasToken: boolean;
  lastStatus: string | null;
  lastLatencyMs: number | null;
}

interface TestResult {
  status: string;
  mode: string;
  latencyMs?: number;
  version?: string;
  error?: string;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<OpenClawConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [mode, setMode] = useState("mock");
  const [baseUrl, setBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const [healthPath, setHealthPath] = useState("/health");
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/openclaw/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setMode(data.mode);
        setBaseUrl(data.baseUrl);
        setHealthPath(data.healthPath);
      }
    } catch {
      setError("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const body: Record<string, string> = {
        mode,
        baseUrl,
        healthPath,
      };
      if (token) body.token = token;

      const res = await fetch("/api/openclaw/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save configuration");
      }

      const data = await res.json();
      setConfig(data.config);
      setTestResult(data.status);
      setToken("");
      setSuccess("Configuration saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/openclaw/health");
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      } else {
        setTestResult({
          status: "disconnected",
          mode,
          error: "Health check failed",
        });
      }
    } catch {
      setTestResult({
        status: "disconnected",
        mode,
        error: "Network error",
      });
    } finally {
      setTesting(false);
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
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
          <Settings className="h-6 w-6 text-slate-400" />
          OpenClaw Settings
        </h1>
        <p className="mt-1 text-sm text-slate-400">Configure your OpenClaw connection</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Mode Toggle */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <label className="mb-3 block text-sm font-semibold text-slate-200">Connection Mode</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode("mock")}
              className={`flex flex-1 flex-col items-center gap-2 rounded-lg border px-4 py-4 transition-colors ${
                mode === "mock"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-slate-700 hover:bg-slate-800"
              }`}
            >
              <Terminal className={`h-6 w-6 ${mode === "mock" ? "text-purple-400" : "text-slate-500"}`} />
              <span className={`text-sm font-medium ${mode === "mock" ? "text-purple-300" : "text-slate-400"}`}>
                Mock Mode
              </span>
              <span className="text-xs text-slate-500">Simulated responses for testing</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("real")}
              className={`flex flex-1 flex-col items-center gap-2 rounded-lg border px-4 py-4 transition-colors ${
                mode === "real"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-700 hover:bg-slate-800"
              }`}
            >
              <Zap className={`h-6 w-6 ${mode === "real" ? "text-blue-400" : "text-slate-500"}`} />
              <span className={`text-sm font-medium ${mode === "real" ? "text-blue-300" : "text-slate-400"}`}>
                Real Mode
              </span>
              <span className="text-xs text-slate-500">Connect to a live OpenClaw instance</span>
            </button>
          </div>
        </div>

        {/* Real mode config */}
        {mode === "real" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Connection Details</h3>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Base URL</label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:8787"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Token {config?.hasToken && <span className="text-xs text-green-400">(set)</span>}
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={config?.hasToken ? "Leave blank to keep existing" : "Enter token"}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Health Path</label>
              <input
                type="text"
                value={healthPath}
                onChange={(e) => setHealthPath(e.target.value)}
                placeholder="/health"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Test Connection */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Connection Test</h3>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Test Connection
            </button>
          </div>

          {testResult && (
            <div
              className={`rounded-lg border p-3 ${
                testResult.status === "connected"
                  ? "border-green-500/20 bg-green-500/10"
                  : testResult.status === "misconfigured"
                  ? "border-amber-500/20 bg-amber-500/10"
                  : "border-red-500/20 bg-red-500/10"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.status === "connected" ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span
                  className={`text-sm font-medium ${
                    testResult.status === "connected"
                      ? "text-green-400"
                      : testResult.status === "misconfigured"
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {testResult.status === "connected"
                    ? "Connected"
                    : testResult.status === "misconfigured"
                    ? "Misconfigured"
                    : "Disconnected"}
                </span>
                <span className="text-xs text-slate-500">({testResult.mode} mode)</span>
              </div>
              {testResult.latencyMs !== undefined && (
                <p className="mt-1 text-xs text-slate-500">Latency: {testResult.latencyMs}ms</p>
              )}
              {testResult.version && (
                <p className="mt-0.5 text-xs text-slate-500">Version: {testResult.version}</p>
              )}
              {testResult.error && (
                <p className="mt-1 text-xs text-red-400">{testResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* PowerShell Helper */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">PowerShell Helper Commands</h3>
          <div className="space-y-2">
            <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-400">
              <p className="text-slate-600 mb-1"># Find OpenClaw process</p>
              <p className="text-green-400">Get-Process | Where-Object {'{ $_.ProcessName -like "*openclaw*" -or $_.ProcessName -like "*wrangler*" }'}</p>
            </div>
            <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-400">
              <p className="text-slate-600 mb-1"># Check if OpenClaw port is listening</p>
              <p className="text-green-400">Test-NetConnection -ComputerName localhost -Port 8787</p>
            </div>
            <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-400">
              <p className="text-slate-600 mb-1"># Start OpenClaw (if you have the project)</p>
              <p className="text-green-400">cd path\to\openclaw; npx wrangler dev</p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Configuration
        </button>
      </form>
    </div>
  );
}
