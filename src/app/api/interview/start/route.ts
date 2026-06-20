import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { generateNextQuestion, topicById, LEVELS, LANGUAGES } from "@/lib/interview";

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    topic?: string;
    level?: string;
    language?: string;
  } | null;

  const topic = body?.topic ?? "";
  const level = body?.level ?? "junior";
  const language = body?.language ?? "vi";

  if (!topicById(topic)) {
    return NextResponse.json({ error: "Chủ đề không hợp lệ." }, { status: 400 });
  }
  if (!LEVELS.some((l) => l.id === level)) {
    return NextResponse.json({ error: "Cấp độ không hợp lệ." }, { status: 400 });
  }
  if (!LANGUAGES.some((l) => l.id === language)) {
    return NextResponse.json({ error: "Ngôn ngữ không hợp lệ." }, { status: 400 });
  }

  const firstQuestion = await generateNextQuestion(topic, level, language, []);

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      topic,
      level,
      language,
      status: "active",
      messages: {
        create: { role: "assistant", content: firstQuestion },
      },
    },
    include: { messages: true },
  });

  return NextResponse.json({ session });
}
