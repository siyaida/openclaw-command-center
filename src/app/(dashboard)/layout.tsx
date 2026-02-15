"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Settings,
  Activity,
  Terminal,
  LogOut,
  ChevronDown,
  User,
  Loader2,
} from "lucide-react";

const sidebarLinks = [
  { href: "/boards", icon: LayoutDashboard, label: "Boards" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/settings/diagnostics", icon: Activity, label: "Diagnostics" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-16 flex-col items-center border-r border-slate-800 bg-slate-900 py-4">
        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <Terminal className="h-5 w-5 text-blue-500" />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                <link.icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign Out"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      {/* Main content area */}
      <div className="ml-16 flex flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-200">OpenClaw Command Center</h2>
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-400">
                {session?.user?.name?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />}
              </div>
              <span className="hidden sm:inline">{session?.user?.name || session?.user?.email}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
                  <div className="border-b border-slate-700 px-3 py-2">
                    <p className="text-xs font-medium text-slate-300">{session?.user?.name}</p>
                    <p className="text-xs text-slate-500">{session?.user?.email}</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
