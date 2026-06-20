import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { generateNextQuestion, MAX_QUESTIONS } from "@/lib/interview";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    answer?: string;
  } | null;
  const answer = body?.answer?.trim();

  if (!answer) {
    return NextResponse.json(
      { error: "Câu trả lời không được để trống." },
      { status: 400 }
    );
  }

  const session = await prisma.interviewSession.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Không tìm thấy buổi phỏng vấn." },
      { status: 404 }
    );
  }
  if (session.status !== "active") {
    return NextResponse.json(
      { error: "Buổi phỏng vấn đã kết thúc." },
      { status: 400 }
    );
  }

  const userMessage = await prisma.message.create({
    data: { sessionId: session.id, role: "user", content: answer },
  });

  const history = [
    ...session.messages.map((m) => ({
      role: m.role as "assistant" | "user",
      content: m.content,
    })),
    { role: "user" as const, content: answer },
  ];

  const askedCount = history.filter((m) => m.role === "assistant").length;
  const done = askedCount >= MAX_QUESTIONS;

  if (done) {
    return NextResponse.json({ userMessage, done: true });
  }

  const nextQuestion = await generateNextQuestion(
    session.topic,
    session.level,
    session.language,
    history,
    session.jd
  );

  const assistantMessage = await prisma.message.create({
    data: { sessionId: session.id, role: "assistant", content: nextQuestion },
  });

  return NextResponse.json({
    userMessage,
    assistantMessage,
    done: false,
    questionNumber: askedCount + 1,
    maxQuestions: MAX_QUESTIONS,
  });
}
