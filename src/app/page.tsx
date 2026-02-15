"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Terminal, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/boards");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
            <Terminal className="h-7 w-7 text-blue-500" />
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">
          OpenClaw{" "}
          <span className="text-blue-500">Command Center</span>
        </h1>

        <p className="mx-auto mb-8 max-w-lg text-lg text-slate-400">
          Kanban-powered project management with integrated OpenClaw automation.
          Organize tasks, run commands, and monitor your development pipeline from one place.
        </p>

        <div className="mb-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
          >
            Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            Create Account
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
              <Terminal className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-slate-200">Command Center</h3>
            <p className="text-xs text-slate-400">
              Execute OpenClaw commands, run scans, validate routes, and export wiring packs.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-green-500/10">
              <Shield className="h-4 w-4 text-green-400" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-slate-200">Kanban Board</h3>
            <p className="text-xs text-slate-400">
              Drag-and-drop task management with priority tracking and OpenClaw bot assignment.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/10">
              <Terminal className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-slate-200">Mock & Real Modes</h3>
            <p className="text-xs text-slate-400">
              Start with mock mode for testing, then connect to a real OpenClaw instance when ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
