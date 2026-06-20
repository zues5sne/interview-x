---
name: testing-interview-x
description: Run and E2E-test the Interview X tester mock-interview app locally. Use when verifying interview flow, AI scoring, auth, or history persistence.
---

# Testing Interview X

Interview X is a Next.js (App Router) + TypeScript + Tailwind app with Prisma/SQLite. Users register/login, run a 6-question AI interview on a tester topic, and get a 0-100 score + feedback. History is saved per user.

## Run locally
```bash
npm install            # postinstall runs `prisma generate`
npx prisma db push     # creates/syncs ./dev.db (SQLite)
npm run dev            # http://localhost:3000
```
Lint/typecheck: `npm run lint` && `npm run typecheck`. Build: `npm run build`.

## AI provider wiring (important)
The interviewer LLM is provider-agnostic (OpenAI SDK pointed at a provider baseURL), in `src/lib/openai.ts` (`getAIClient`) and `src/lib/interview.ts`.
- Provider auto-detected from whichever key is set: `GROQ_API_KEY` > `GEMINI_API_KEY` > `OPENAI_API_KEY`. Override with `AI_PROVIDER` / `AI_MODEL`.
- Defaults: groq=`llama-3.3-70b-versatile`, gemini=`gemini-2.0-flash`, openai=`gpt-4o-mini`.
- **No key => built-in mock questions** (fixed canned list in `mockNextQuestion`). The dev server must be (re)started AFTER the key env var is set, or it stays on mock.

## Key E2E flow
1. `/register` (name/email/password) -> redirects to `/dashboard`. New user history is empty ("Bạn chưa có buổi phỏng vấn nào").
2. Dashboard: pick a topic card (Manual/Automation/API/Performance/QA Fundamentals/Mobile), a level (Junior/Middle/Senior), a language (vi/en), click "Bắt đầu phỏng vấn" -> `/interview/[id]`.
3. Type answer in textarea, click "Gửi". Progress increments x/6; a new interviewer question appears.
4. Click "Kết thúc & chấm điểm" -> result card with score (0-100) + markdown feedback.
5. Back on `/dashboard`, the finished session appears in "Lịch sử phỏng vấn" with the same score (persistence check).

## Adversarial assertion (real AI vs mock)
The single most important check: follow-up questions must **reference the candidate's previous answer** (e.g. echo specific tools/terms you typed). Mock questions are fixed and ignore your wording. If follow-ups are generic/canned, the provider key isn't being picked up (restart dev server with the key set).

## Gotchas
- After restarting the dev server, the browser session cookie persists but navigating mid-login can drop the cookie; wait for the login redirect to finish before navigating away.
- Llama (Groq) sometimes inserts stray CJK characters in long feedback — model quirk, not an app bug; try `AI_PROVIDER=gemini` for cleaner prose.
- Voice (🎤 STT / 🔊 TTS) uses the browser Web Speech API; in headless/automated runs assert control presence only, not actual audio.

## Devin Secrets Needed
- `GROQ_API_KEY` (free, console.groq.com) — default provider. Optional alternatives: `GEMINI_API_KEY`, `OPENAI_API_KEY`. None set => mock mode (app still runs).
