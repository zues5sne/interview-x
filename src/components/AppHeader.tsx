"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AppHeader({ userName }: { userName: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Interview<span className="text-sky-400">X</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-slate-400 sm:inline">{userName}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
