"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import CameraPanel from "@/components/CameraPanel";
import { useSpeechRecognition, useSpeechSynthesis } from "@/lib/useSpeech";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type Props = {
  sessionId: string;
  topicLabel: string;
  topicEmoji: string;
  levelLabel: string;
  language: string;
  maxQuestions: number;
  initialStatus: string;
  initialScore: number | null;
  initialFeedback: string | null;
  initialMessages: ChatMessage[];
};

export default function InterviewRoom(props: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(props.initialMessages);
  const [status, setStatus] = useState(props.initialStatus);
  const [score, setScore] = useState<number | null>(props.initialScore);
  const [feedback, setFeedback] = useState<string | null>(props.initialFeedback);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const recognition = useSpeechRecognition(props.language);
  const synthesis = useSpeechSynthesis(props.language);

  const spokenRef = useRef<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  const answeredCount = messages.filter((m) => m.role === "user").length;
  const isActive = status === "active";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, finishing, feedback]);

  const speak = useCallback(
    (msg: ChatMessage) => {
      if (spokenRef.current.has(msg.id)) return;
      spokenRef.current.add(msg.id);
      synthesis.speak(msg.content);
    },
    [synthesis]
  );

  // Auto-speak the latest assistant question (after first user gesture).
  useEffect(() => {
    if (!autoSpeak || !isActive || !startedRef.current) return;
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant") speak(last);
  }, [messages, autoSpeak, isActive, speak]);

  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    // Speak the current question now that we have a user gesture.
    if (autoSpeak) {
      const last = messages[messages.length - 1];
      if (last && last.role === "assistant") speak(last);
    }
  }

  function toggleMic() {
    markStarted();
    if (recognition.listening) {
      recognition.stop();
    } else {
      synthesis.cancel();
      recognition.start(input, setInput);
    }
  }

  async function sendAnswer() {
    const answer = input.trim();
    if (!answer || submitting) return;
    markStarted();
    recognition.stop();
    synthesis.cancel();
    setSubmitting(true);
    setError(null);

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: answer,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const res = await fetch(`/api/interview/${props.sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không gửi được câu trả lời.");
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setInput(answer);
        return;
      }

      setMessages((prev) => {
        const next = prev.map((m) =>
          m.id === optimistic.id ? (data.userMessage as ChatMessage) : m
        );
        if (data.assistantMessage) next.push(data.assistantMessage as ChatMessage);
        return next;
      });

      if (data.done) {
        await finishInterview();
      }
    } catch {
      setError("Không thể kết nối tới máy chủ.");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(answer);
    } finally {
      setSubmitting(false);
    }
  }

  async function finishInterview() {
    if (finishing) return;
    recognition.stop();
    synthesis.cancel();
    setFinishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/interview/${props.sessionId}/finish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không thể kết thúc buổi phỏng vấn.");
        return;
      }
      setScore(data.score);
      setFeedback(data.feedback);
      setStatus("finished");
      router.refresh();
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      {/* Header card */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{props.topicEmoji}</span>
          <div>
            <div className="font-semibold">{props.topicLabel}</div>
            <div className="text-xs text-slate-400">{props.levelLabel}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Tiến độ</div>
          <div className="font-semibold">
            {Math.min(answeredCount, props.maxQuestions)}/{props.maxQuestions}
          </div>
        </div>
      </div>

      {/* Camera (real-interview feel) */}
      {isActive && <CameraPanel />}

      {/* Chat */}
      <div className="flex-1 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "bg-sky-500 text-white"
                  : "border border-slate-800 bg-slate-900/70 text-slate-100"
              }`}
            >
              {m.role === "assistant" && (
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-sky-400">
                  <span>🎙️ Interviewer</span>
                  {synthesis.supported && (
                    <button
                      onClick={() => synthesis.speak(m.content)}
                      className="text-slate-400 hover:text-white"
                      title="Nghe lại câu hỏi"
                    >
                      🔊
                    </button>
                  )}
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {m.content}
              </p>
            </div>
          </div>
        ))}

        {(submitting || finishing) && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
              {finishing ? "Đang chấm điểm buổi phỏng vấn..." : "Đang soạn câu hỏi tiếp theo..."}
            </div>
          </div>
        )}

        {status === "finished" && feedback && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-emerald-500/40 bg-slate-950">
                <span className="text-2xl font-bold text-emerald-400">
                  {score}
                </span>
                <span className="text-[10px] text-slate-400">/100</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">Kết quả phỏng vấn</h2>
                <p className="text-sm text-slate-400">
                  Nhận xét chi tiết từ AI bên dưới.
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-emerald-500/20 pt-4">
              <Markdown>{feedback}</Markdown>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-400"
              >
                Phỏng vấn buổi mới
              </Link>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Input */}
      {isActive && (
        <div className="sticky bottom-0 mt-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-3 backdrop-blur">
          <div className="flex items-end gap-2">
            {recognition.supported && (
              <button
                onClick={toggleMic}
                disabled={submitting || finishing}
                title={recognition.listening ? "Dừng ghi âm" : "Trả lời bằng giọng nói"}
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg disabled:opacity-50 ${
                  recognition.listening
                    ? "animate-pulse-ring bg-red-500 text-white"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                🎤
              </button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendAnswer();
                }
              }}
              rows={1}
              placeholder={
                recognition.listening
                  ? "Đang nghe... hãy nói câu trả lời của bạn"
                  : "Nhập câu trả lời, hoặc bấm 🎤 để nói..."
              }
              className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
            <button
              onClick={sendAnswer}
              disabled={submitting || finishing || !input.trim()}
              className="h-11 shrink-0 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
            >
              Gửi
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-xs text-slate-500">
            <label className="flex items-center gap-2">
              {synthesis.supported ? (
                <>
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="accent-sky-500"
                  />
                  Tự động đọc câu hỏi
                </>
              ) : (
                <span>Trình duyệt không hỗ trợ đọc giọng nói</span>
              )}
            </label>
            <button
              onClick={finishInterview}
              disabled={finishing || answeredCount === 0}
              className="rounded-lg border border-slate-700 px-3 py-1 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Kết thúc &amp; chấm điểm
            </button>
          </div>
          {!recognition.supported && (
            <p className="mt-2 px-1 text-xs text-amber-400/80">
              Mẹo: dùng Chrome để trả lời bằng giọng nói. Hiện bạn vẫn có thể gõ
              câu trả lời.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
