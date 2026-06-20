"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function CameraPanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [on, setOn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setOn(false);
  }, []);

  const start = useCallback(async () => {
    if (starting || on) return;
    setError(null);
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Trình duyệt không hỗ trợ webcam.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setOn(true);
    } catch {
      setError("Không truy cập được webcam. Hãy cho phép quyền camera.");
    } finally {
      setStarting(false);
    }
  }, [starting, on]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="relative aspect-video w-full bg-slate-950">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={`h-full w-full -scale-x-100 object-cover ${on ? "" : "hidden"}`}
        />
        {!on && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <span className="text-4xl">📷</span>
            <span className="text-xs">
              {error ?? "Camera đang tắt"}
            </span>
          </div>
        )}
        {on && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            LIVE
          </span>
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-xs text-slate-400">
          Camera phỏng vấn {on ? "đang bật" : "đang tắt"} · video chỉ hiển thị
          trên máy bạn
        </span>
        <button
          onClick={on ? stop : start}
          disabled={starting}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
            on
              ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "bg-sky-500 text-white hover:bg-sky-400"
          }`}
        >
          {starting ? "Đang bật..." : on ? "Tắt camera" : "Bật camera"}
        </button>
      </div>
    </div>
  );
}
