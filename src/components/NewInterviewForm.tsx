"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TOPICS,
  LEVELS,
  LANGUAGES,
  QUESTION_COUNT_OPTIONS,
  DEFAULT_QUESTION_COUNT,
} from "@/lib/catalog";

export default function NewInterviewForm() {
  const router = useRouter();
  const [topic, setTopic] = useState(TOPICS[0].id);
  const [level, setLevel] = useState<string>(LEVELS[0].id);
  const [language, setLanguage] = useState<string>(LANGUAGES[0].id);
  const [jd, setJd] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(DEFAULT_QUESTION_COUNT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level, language, jd, questionCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không thể bắt đầu buổi phỏng vấn.");
        return;
      }
      router.push(`/interview/${data.session.id}`);
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-xl font-semibold">Bắt đầu buổi phỏng vấn mới</h2>
      <p className="mt-1 text-sm text-slate-400">
        AI sẽ hỏi {questionCount} câu, bạn trả lời bằng giọng nói hoặc gõ chữ.
      </p>

      <div className="mt-5">
        <span className="mb-2 block text-sm font-medium text-slate-300">
          Chủ đề
        </span>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTopic(t.id)}
              className={`rounded-xl border p-4 text-left transition ${
                topic === t.id
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-slate-700 bg-slate-950/40 hover:border-slate-600"
              }`}
            >
              <div className="text-xl">{t.emoji}</div>
              <div className="mt-1 font-medium">{t.label}</div>
              <div className="mt-0.5 text-xs text-slate-400">
                {t.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Cấp độ
          </span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-white focus:border-sky-500 focus:outline-none"
          >
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Ngôn ngữ phỏng vấn
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-white focus:border-sky-500 focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Số câu hỏi
          </span>
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-white focus:border-sky-500 focus:outline-none"
          >
            {QUESTION_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} câu
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-medium text-slate-300">
          Mô tả công việc / JD <span className="text-slate-500">(tùy chọn)</span>
        </span>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={4}
          placeholder="Dán JD vào đây để AI hỏi sâu và bám sát yêu cầu công việc (kỹ năng, công cụ, kinh nghiệm...). Để trống thì AI hỏi theo chủ đề đã chọn."
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
        />
      </label>

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        onClick={start}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white hover:bg-sky-400 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {loading ? "Đang chuẩn bị..." : "Bắt đầu phỏng vấn 🎙️"}
      </button>
    </div>
  );
}
