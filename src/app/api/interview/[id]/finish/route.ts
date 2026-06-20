import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { generateEvaluation } from "@/lib/interview";

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await ctx.params;

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
  if (session.status === "finished") {
    return NextResponse.json({
      score: session.score,
      feedback: session.feedback,
    });
  }

  const history = session.messages.map((m) => ({
    role: m.role as "assistant" | "user",
    content: m.content,
  }));

  const hasAnswers = history.some((m) => m.role === "user");
  if (!hasAnswers) {
    return NextResponse.json(
      { error: "Bạn chưa trả lời câu hỏi nào." },
      { status: 400 }
    );
  }

  const evaluation = await generateEvaluation(
    session.topic,
    session.level,
    session.language,
    history
  );

  const updated = await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      status: "finished",
      score: evaluation.score,
      feedback: evaluation.feedback,
      finishedAt: new Date(),
    },
  });

  return NextResponse.json({
    score: updated.score,
    feedback: updated.feedback,
  });
}
