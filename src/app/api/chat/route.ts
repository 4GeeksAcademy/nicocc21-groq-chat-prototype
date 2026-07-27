import { NextRequest, NextResponse } from "next/server";
import { chat, ChatMessage } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Se esperaba un array de mensajes." },
        { status: 400 }
      );
    }

    const result = await chat(messages);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Error en /api/chat:", err);
    const message =
      err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
