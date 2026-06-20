import { NextResponse } from "next/server";
import { toFile } from "openai";
import { getUserId } from "@/lib/auth";
import { getGroqClient, GROQ_TRANSCRIBE_MODEL } from "@/lib/openai";

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const groq = getGroqClient();
  if (!groq) {
    return NextResponse.json(
      { error: "Chưa cấu hình GROQ_API_KEY cho nhận diện giọng nói." },
      { status: 503 }
    );
  }

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const language = (form?.get("language") as string) || "vi";

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json(
      { error: "Không nhận được dữ liệu âm thanh." },
      { status: 400 }
    );
  }

  try {
    const file = await toFile(audio, "audio.webm", {
      type: audio.type || "audio/webm",
    });
    const result = await groq.audio.transcriptions.create({
      file,
      model: GROQ_TRANSCRIBE_MODEL,
      language,
    });
    return NextResponse.json({ text: result.text.trim() });
  } catch {
    return NextResponse.json(
      { error: "Không thể chuyển giọng nói thành văn bản." },
      { status: 502 }
    );
  }
}
