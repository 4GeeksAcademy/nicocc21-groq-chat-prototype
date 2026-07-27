import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatMetrics {
  reply: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  responseTimeMs: number;
}

export async function chat(messages: ChatMessage[]): Promise<ChatMetrics> {
  const start = performance.now();

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "Eres un asistente útil y amigable. Responde en español de forma clara y concisa.",
      },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  const responseTimeMs = Math.round(performance.now() - start);

  const choice = completion.choices[0];
  const reply = choice?.message?.content || "No pude generar una respuesta.";

  return {
    reply,
    model: completion.model,
    usage: {
      prompt_tokens: completion.usage?.prompt_tokens ?? 0,
      completion_tokens: completion.usage?.completion_tokens ?? 0,
      total_tokens: completion.usage?.total_tokens ?? 0,
    },
    responseTimeMs,
  };
}
