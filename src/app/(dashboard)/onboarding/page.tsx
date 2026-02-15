"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Terminal,
  Zap,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Rocket,
  Eye,
  EyeOff,
} from "lucide-react";

const steps = [
  { title: "Welcome", description: "Get started" },
  { title: "Configure", description: "OpenClaw setup" },
  { title: "Test", description: "Verify connection" },
  { title: "Done", description: "Ready to go" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Config state
  const [mode, setMode] = useState("mock");
  const [baseUrl, setBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const [healthPath, setHealthPath] = useState("/health");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: string;
    mode: string;
    latencyMs?: number;
    version?: string;
    error?: string;
  } | null>(null);

  async function handleSaveConfig() {
    setSaving(true);
    setSaveError("");

    try {
      const body: Record<string, string> = { mode, baseUrl, healthPath };
      if (token) body.token = token;

      const res = await fetch("/api/openclaw/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save config");

      setCurrentStep(2);
    } catch {
      setSaveError("Failed to save configuration. Please try again.");
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
        setTestResult({ status: "disconnected", mode, error: "Health check failed" });
      }
    } catch {
      setTestResult({ status: "disconnected", mode, error: "Network error" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6 pt-12">
      {/* Stepper */}
      <div className="mb-10 flex items-center justify-center gap-1">
        {steps.map((step, i) => (
          <div key={step.title} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < currentStep
                    ? "bg-blue-500 text-white"
                    : i === currentStep
                    ? "bg-blue-500/20 text-blue-400 ring-2 ring-blue-500"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`mt-1 text-[10px] ${
                  i === currentStep ? "text-blue-400" : "text-slate-500"
                }`}
              >
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-12 rounded ${
                  i < currentStep ? "bg-blue-500" : "bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        {/* Step 0: Welcome */}
        {currentStep === 0 && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/20">
              <Terminal className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-100">
              Welcome to OpenClaw Command Center
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              Let&apos;s get your workspace set up. We&apos;ll configure your OpenClaw connection
              and make sure everything is working properly.
            </p>
            <p className="mb-8 text-xs text-slate-500">
              You can always change these settings later from the Settings page.
            </p>
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 1: Configure */}
        {currentStep === 1 && (
          <div>
            <h2 className="mb-1 text-lg font-bold text-slate-100">Configure OpenClaw</h2>
            <p className="mb-6 text-sm text-slate-400">
              Choose how to connect to OpenClaw. Mock mode is great for getting started.
            </p>

            {saveError && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {saveError}
              </div>
            )}

            <div className="space-y-4">
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
                  <Terminal
                    className={`h-5 w-5 ${mode === "mock" ? "text-purple-400" : "text-slate-500"}`}
                  />
                  <span
                    className={`text-sm font-medium ${mode === "mock" ? "text-purple-300" : "text-slate-400"}`}
                  >
                    Mock Mode
                  </span>
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
                  <Zap
                    className={`h-5 w-5 ${mode === "real" ? "text-blue-400" : "text-slate-500"}`}
                  />
                  <span
                    className={`text-sm font-medium ${mode === "real" ? "text-blue-300" : "text-slate-400"}`}
                  >
                    Real Mode
                  </span>
                </button>
              </div>

              {mode === "real" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Base URL
                    </label>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://localhost:8787"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">Token</label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Enter API token"
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
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Health Path
                    </label>
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
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(0)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save & Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Test */}
        {currentStep === 2 && (
          <div className="text-center">
            <h2 className="mb-1 text-lg font-bold text-slate-100">Test Connection</h2>
            <p className="mb-6 text-sm text-slate-400">
              Let&apos;s verify your OpenClaw connection is working.
            </p>

            <button
              onClick={handleTest}
              disabled={testing}
              className="mb-6 inline-flex items-center gap-2 rounded-lg bg-purple-500 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Run Health Check
            </button>

            {testResult && (
              <div
                className={`mb-6 rounded-lg border p-4 text-left ${
                  testResult.status === "connected"
                    ? "border-green-500/20 bg-green-500/10"
                    : "border-red-500/20 bg-red-500/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.status === "connected" ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      testResult.status === "connected" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {testResult.status === "connected" ? "Connection Successful" : "Connection Failed"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  <p>Mode: {testResult.mode}</p>
                  {testResult.latencyMs != null && <p>Latency: {testResult.latencyMs}ms</p>}
                  {testResult.version && <p>Version: {testResult.version}</p>}
                  {testResult.error && <p className="text-red-400">Error: {testResult.error}</p>}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {currentStep === 3 && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/20">
              <Rocket className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-100">You&apos;re All Set!</h2>
            <p className="mb-8 text-sm text-slate-400">
              Your OpenClaw Command Center is ready. Start managing your boards, running commands,
              and automating your workflow.
            </p>
            <button
              onClick={() => router.push("/boards")}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Go to Boards
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
