// apps/socket-server/src/services/geminiService.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

interface ContextMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `Kamu adalah Gemini, AI assistant yang membantu diskusi dalam grup chat.
Kamu memiliki akses ke riwayat percakapan grup untuk memahami konteks.
Berikan respons yang relevan, ringkas, dan membantu.
Jika ada pertanyaan teknis, berikan jawaban yang akurat dan terstruktur.
Gunakan bahasa yang sama dengan bahasa yang digunakan dalam percakapan.`;

export async function getGeminiResponse(
  contextMessages: ContextMessage[],
  currentPrompt: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  // Hapus tag @Gemini dari prompt
  const cleanPrompt = currentPrompt.replace(/@Gemini\s*/gi, '').trim();

  const result = await streamText({
    model: google('gemini-2.0-flash'),
    system: SYSTEM_PROMPT,
    messages: [
      // Kirim konteks percakapan sebelumnya
      ...contextMessages.slice(0, -1), // Semua kecuali pesan terakhir (yang sudah ada di prompt)
      {
        role: 'user',
        content: cleanPrompt,
      },
    ],
  });

  // Stream chunks ke callback
  for await (const chunk of result.textStream) {
    onChunk(chunk);
  }
}
