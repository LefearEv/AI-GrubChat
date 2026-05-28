// apps/socket-server/src/services/openaiService.ts
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface ContextMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `Kamu adalah ChatGPT, AI assistant yang membantu diskusi dalam grup chat.
Kamu memiliki akses ke riwayat percakapan grup untuk memahami konteks.
Berikan respons yang relevan, ringkas, dan membantu.
Jika ada pertanyaan teknis, berikan jawaban yang akurat dan terstruktur.
Gunakan bahasa yang sama dengan bahasa yang digunakan dalam percakapan.`;

export async function getOpenAIResponse(
  contextMessages: ContextMessage[],
  currentPrompt: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  // Hapus tag @ChatGPT dari prompt
  const cleanPrompt = currentPrompt.replace(/@ChatGPT\s*/gi, '').trim();

  const result = await streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT,
    messages: [
      ...contextMessages.slice(0, -1),
      {
        role: 'user',
        content: cleanPrompt,
      },
    ],
  });

  for await (const chunk of result.textStream) {
    onChunk(chunk);
  }
}
