"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister ? { name, email, password } : { email, password }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Đã có lỗi xảy ra.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center text-lg font-bold tracking-tight"
        >
          Interview<span className="text-sky-400">X</span>
        </Link>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur">
          <h1 className="text-2xl font-bold">
            {isRegister ? "Tạo tài khoản" : "Đăng nhập"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isRegister
              ? "Bắt đầu luyện phỏng vấn Tester ngay."
              : "Chào mừng bạn quay lại."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <Field
                label="Họ và tên"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="ban@email.com"
              autoComplete="email"
            />
            <Field
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
            >
              {loading
                ? "Đang xử lý..."
                : isRegister
                  ? "Đăng ký"
                  : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {isRegister ? (
              <>
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-sky-400 hover:underline">
                  Đăng nhập
                </Link>
              </>
            ) : (
              <>
                Chưa có tài khoản?{" "}
                <Link href="/register" className="text-sky-400 hover:underline">
                  Đăng ký
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
      />
    </label>
  );
}
