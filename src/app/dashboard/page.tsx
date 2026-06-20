import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { topicById, levelLabel } from "@/lib/catalog";
import AppHeader from "@/components/AppHeader";
import NewInterviewForm from "@/components/NewInterviewForm";

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader userName={user.name} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">Xin chào, {user.name} 👋</h1>
          <p className="text-slate-400">Sẵn sàng luyện phỏng vấn Tester chưa?</p>
        </div>

        <div className="mt-6">
          <NewInterviewForm />
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Lịch sử phỏng vấn</h2>
          {sessions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400">
              Bạn chưa có buổi phỏng vấn nào. Hãy bắt đầu buổi đầu tiên!
            </p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => {
                const t = topicById(s.topic);
                const finished = s.status === "finished";
                return (
                  <li key={s.id}>
                    <Link
                      href={`/interview/${s.id}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-600"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{t?.emoji ?? "💬"}</span>
                        <div>
                          <div className="font-medium">
                            {t?.label ?? s.topic}
                          </div>
                          <div className="text-sm text-slate-400">
                            {levelLabel(s.level)} · {formatDate(s.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {finished ? (
                          <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-400">
                            {s.score}/100
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-400">
                            Đang diễn ra
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
