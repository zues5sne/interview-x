import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";
import { topicById } from "@/lib/catalog";

export { TOPICS, LEVELS, LANGUAGES, MAX_QUESTIONS, topicById } from "@/lib/catalog";

function languageName(lang: string): string {
  return lang === "en" ? "English" : "Vietnamese";
}

function buildSystemPrompt(topic: string, level: string, language: string): string {
  const t = topicById(topic);
  const topicLabel = t ? `${t.label} (${t.description})` : topic;
  return [
    `You are "Interview X", a senior QA / software tester interviewer.`,
    `You are conducting a job interview for a Software Tester / QA Engineer position.`,
    `Topic focus: ${topicLabel}.`,
    `Candidate level: ${level}.`,
    `Conduct the entire interview in ${languageName(language)}.`,
    `Ask ONE question at a time. Keep each question concise (1-3 sentences).`,
    `Start easier and progressively go deeper based on the candidate's answers.`,
    `Ask realistic, practical questions a real tester would face. Mix concept, scenario, and behavioral questions.`,
    `Do NOT provide the answer or feedback during the interview — only ask the next question.`,
    `Do not number the questions. Do not add any preamble like "Question:". Just output the question text.`,
  ].join(" ");
}

type HistoryMessage = { role: "assistant" | "user"; content: string };

export async function generateNextQuestion(
  topic: string,
  level: string,
  language: string,
  history: HistoryMessage[]
): Promise<string> {
  const openai = getOpenAI();
  if (!openai) {
    return mockNextQuestion(topic, language, history);
  }

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(topic, level, language) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];
  if (history.length === 0) {
    messages.push({
      role: "user",
      content:
        "Begin the interview now with a short greeting and your first question.",
    });
  }

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    temperature: 0.8,
    max_tokens: 300,
  });
  return (
    res.choices[0]?.message?.content?.trim() ||
    mockNextQuestion(topic, language, history)
  );
}

export type Evaluation = {
  score: number;
  feedback: string;
};

export async function generateEvaluation(
  topic: string,
  level: string,
  language: string,
  history: HistoryMessage[]
): Promise<Evaluation> {
  const openai = getOpenAI();
  if (!openai) {
    return mockEvaluation(language);
  }

  const transcript = history
    .map((m) => `${m.role === "assistant" ? "INTERVIEWER" : "CANDIDATE"}: ${m.content}`)
    .join("\n");

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          buildSystemPrompt(topic, level, language) +
          ` The interview is over. Evaluate the candidate based on the transcript.` +
          ` Respond ONLY with a JSON object: {"score": <integer 0-100>, "feedback": "<detailed feedback in ${languageName(
            language
          )}>"}.` +
          ` In the feedback, mention strengths, weaknesses, and concrete suggestions to improve. Use markdown with short bullet points.`,
      },
      { role: "user", content: `Transcript:\n${transcript}` },
    ],
  });

  const raw = res.choices[0]?.message?.content?.trim() ?? "{}";
  try {
    const parsed = JSON.parse(raw) as { score?: number; feedback?: string };
    const score = Math.max(0, Math.min(100, Math.round(parsed.score ?? 0)));
    return {
      score,
      feedback: parsed.feedback ?? mockEvaluation(language).feedback,
    };
  } catch {
    return mockEvaluation(language);
  }
}

// ---- Mock fallback (used when no OPENAI_API_KEY is configured) ----

const MOCK_QUESTIONS: Record<string, string[]> = {
  vi: [
    "Chào bạn! Bạn có thể giới thiệu ngắn gọn về kinh nghiệm kiểm thử của mình không?",
    "Sự khác nhau giữa Verification và Validation là gì?",
    "Bạn thiết kế test case cho một ô đăng nhập (login) như thế nào?",
    "Severity và Priority của một bug khác nhau ra sao? Cho ví dụ.",
    "Khi gặp một bug khó tái hiện (intermittent), bạn xử lý thế nào?",
    "Theo bạn, tiêu chí nào để quyết định dừng việc kiểm thử (exit criteria)?",
  ],
  en: [
    "Hi! Could you briefly introduce your testing experience?",
    "What is the difference between Verification and Validation?",
    "How would you design test cases for a login field?",
    "How do Severity and Priority of a bug differ? Give an example.",
    "How do you handle a bug that is hard to reproduce (intermittent)?",
    "What criteria would you use to decide when to stop testing (exit criteria)?",
  ],
};

function mockNextQuestion(
  _topic: string,
  language: string,
  history: HistoryMessage[]
): string {
  const list = MOCK_QUESTIONS[language] ?? MOCK_QUESTIONS.vi;
  const asked = history.filter((m) => m.role === "assistant").length;
  return list[Math.min(asked, list.length - 1)];
}

function mockEvaluation(language: string): Evaluation {
  return {
    score: 70,
    feedback:
      language === "en"
        ? "**Demo evaluation** (no AI key configured).\n\n- Strengths: provided answers to all questions.\n- To improve: add concrete examples.\n\nConfigure `OPENAI_API_KEY` to get a real AI evaluation."
        : "**Đánh giá demo** (chưa cấu hình AI key).\n\n- Điểm mạnh: đã trả lời hết các câu hỏi.\n- Cần cải thiện: bổ sung ví dụ cụ thể.\n\nHãy cấu hình `OPENAI_API_KEY` để nhận đánh giá AI thực sự.",
  };
}
