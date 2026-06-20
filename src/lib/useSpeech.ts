"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Minimal typings for the Web Speech API (not in standard lib.dom).
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function localeFor(language: string): string {
  return language === "en" ? "en-US" : "vi-VN";
}

const noopSubscribe = () => () => {};

function useClientFlag(check: () => boolean): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => check(),
    () => false
  );
}

export function useSpeechRecognition(language: string) {
  const supported = useClientFlag(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback(
    (existing: string, onUpdate: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;
      const recognition = new Ctor();
      recognition.lang = localeFor(language);
      recognition.continuous = true;
      recognition.interimResults = true;
      const base = existing ? existing.trim() + " " : "";

      recognition.onresult = (e) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        onUpdate(base + text);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    },
    [language]
  );

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}

export function useGroqRecorder(language: string) {
  const supported = useClientFlag(
    () =>
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof window.MediaRecorder !== "undefined"
  );
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const onTextRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = useCallback(
    async (existing: string, onText: (text: string) => void) => {
      setError(null);
      onTextRef.current = (text: string) => {
        const base = existing ? existing.trim() + " " : "";
        onText(base + text);
      };
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        chunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          const mime = recorder.mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: mime });
          if (blob.size === 0) {
            setError("Không ghi được âm thanh. Hãy thử lại và nói to hơn.");
            return;
          }
          const ext = mime.includes("ogg")
            ? "ogg"
            : mime.includes("mp4") || mime.includes("mpeg")
            ? "mp4"
            : "webm";
          setTranscribing(true);
          try {
            const fd = new FormData();
            fd.append("audio", blob, `audio.${ext}`);
            fd.append("language", language === "en" ? "en" : "vi");
            const res = await fetch("/api/transcribe", {
              method: "POST",
              body: fd,
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error ?? "Không nhận diện được giọng nói.");
              return;
            }
            if (data.text) {
              onTextRef.current?.(data.text);
            } else {
              setError("Không nghe rõ. Hãy nói gần micro và to hơn rồi thử lại.");
            }
          } catch {
            setError("Không thể kết nối máy chủ nhận diện giọng nói.");
          } finally {
            setTranscribing(false);
          }
        };
        recorder.start();
        recorderRef.current = recorder;
        setRecording(true);
      } catch {
        setError("Không truy cập được micro. Hãy bấm Allow khi trình duyệt hỏi.");
      }
    },
    [language]
  );

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  return { supported, recording, transcribing, error, start, stop };
}

export function useSpeechSynthesis(language: string) {
  const supported = useClientFlag(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    // Pre-load the voice list (some browsers populate it asynchronously).
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;
      const synth = window.speechSynthesis;
      synth.cancel();

      const locale = localeFor(language);
      const prefix = language === "en" ? "en" : "vi";
      const voices = synth.getVoices();
      const voice =
        voices.find((v) => v.lang === locale) ??
        voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
        null;

      // Chrome cuts off / stutters on long utterances. Speak sentence by
      // sentence so each utterance stays short and plays smoothly.
      const chunks = (text.match(/[^.!?…。\n]+[.!?…。]*/g) ?? [text])
        .map((s) => s.trim())
        .filter(Boolean);
      if (chunks.length === 0) return;

      let i = 0;
      const speakNext = () => {
        if (i >= chunks.length) {
          setSpeaking(false);
          return;
        }
        const utterance = new SpeechSynthesisUtterance(chunks[i]);
        utterance.lang = locale;
        if (voice) utterance.voice = voice;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onend = () => {
          i += 1;
          speakNext();
        };
        utterance.onerror = () => {
          i += 1;
          speakNext();
        };
        synth.speak(utterance);
      };

      setSpeaking(true);
      speakNext();
    },
    [language]
  );

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  return { supported, speaking, speak, cancel };
}
