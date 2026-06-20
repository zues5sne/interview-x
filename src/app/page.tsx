import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { TOPICS } from "@/lib/catalog";

export default async function Home() {
  const userId = await getUserId();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold tracking-tight">
          Interview<span className="text-sky-400">X</span>
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-slate-300 hover:text-white"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400"
          >
            Đăng ký
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-300">
          🎙️ Phỏng vấn bằng giọng nói + AI chấm điểm
        </span>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Luyện phỏng vấn{" "}
          <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
            Software Tester
          </span>{" "}
          cùng AI
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          Interview X đóng vai người phỏng vấn QA/Tester. Nói chuyện trực tiếp
          bằng giọng nói, trả lời các câu hỏi thực tế và nhận đánh giá chi tiết
          kèm điểm số sau buổi phỏng vấn.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-sky-500 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400"
          >
            Bắt đầu miễn phí
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-700 px-7 py-3 text-base font-semibold text-slate-200 hover:bg-slate-800"
          >
            Tôi đã có tài khoản
          </Link>
        </div>

        <div className="mt-20 grid w-full gap-4 sm:grid-cols-3">
          {TOPICS.slice(0, 6).map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-left"
            >
              <div className="text-2xl">{t.emoji}</div>
              <div className="mt-2 font-semibold">{t.label}</div>
              <div className="mt-1 text-sm text-slate-400">{t.description}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-center text-sm text-slate-500">
        Interview X — luyện phỏng vấn Tester với AI.
      </footer>
    </main>
  );
}
