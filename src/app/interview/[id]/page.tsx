import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { topicById, levelLabel, MAX_QUESTIONS } from "@/lib/catalog";
import AppHeader from "@/components/AppHeader";
import InterviewRoom from "@/components/InterviewRoom";

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const session = await prisma.interviewSession.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) notFound();

  const topic = topicById(session.topic);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader userName={user.name} />
      <InterviewRoom
        sessionId={session.id}
        topicLabel={topic?.label ?? session.topic}
        topicEmoji={topic?.emoji ?? "💬"}
        levelLabel={levelLabel(session.level)}
        language={session.language}
        maxQuestions={MAX_QUESTIONS}
        initialStatus={session.status}
        initialScore={session.score}
        initialFeedback={session.feedback}
        initialMessages={session.messages.map((m) => ({
          id: m.id,
          role: m.role as "assistant" | "user",
          content: m.content,
        }))}
      />
    </div>
  );
}
