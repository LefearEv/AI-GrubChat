// apps/web/src/app/api/ai/chat/route.ts
// Streaming AI chat untuk Private AI Chat (bukan grup)
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(10000),
  provider: z.enum(['gemini', 'chatgpt']),
});

const SYSTEM_PROMPT = `Kamu adalah AI assistant yang membantu pengguna secara personal.
Berikan respons yang akurat, ringkas, dan membantu.
Gunakan bahasa yang sama dengan bahasa pengguna.`;

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { sessionId, message, provider } = parsed.data;

  // Verifikasi sesi milik user ini
  const aiSession = await prisma.aiSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!aiSession) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });

  // Simpan pesan user
  await prisma.message.create({
    data: {
      aiSessionId: sessionId,
      senderId: userId,
      senderType: 'user',
      chatType: 'private_ai',
      content: message,
    },
  });

  // Ambil riwayat percakapan (20 pesan terakhir)
  const history = await prisma.message.findMany({
    where: { aiSessionId: sessionId, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const orderedHistory = history.reverse();

  const contextMessages = orderedHistory.slice(0, -1).map((m) => ({
    role: m.senderType === 'user' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }));

  // Auto-generate judul dari pesan pertama
  if (orderedHistory.length === 1) {
    const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
    await prisma.aiSession.update({
      where: { id: sessionId },
      data: { title },
    });
  }

  // Stream respons AI
  let fullResponse = '';

  const streamResponse = async () => {
    if (provider === 'gemini') {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
      });
      const result = await streamText({
        model: google('gemini-2.0-flash'),
        system: SYSTEM_PROMPT,
        messages: [...contextMessages, { role: 'user', content: message }],
      });

      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
          // Simpan respons AI ke DB
          await prisma.message.create({
            data: {
              aiSessionId: sessionId,
              senderId: null,
              senderType: 'ai_gemini',
              chatType: 'private_ai',
              content: fullResponse,
              aiModel: 'gemini-2.0-flash',
            },
          });
          // Update stats
          await prisma.userStats.upsert({
            where: { userId },
            update: { totalAiInteractions: { increment: 1 } },
            create: { userId, totalAiInteractions: 1 },
          });
          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      const result = await streamText({
        model: openai('gpt-4o'),
        system: SYSTEM_PROMPT,
        messages: [...contextMessages, { role: 'user', content: message }],
      });

      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
          await prisma.message.create({
            data: {
              aiSessionId: sessionId,
              senderId: null,
              senderType: 'ai_chatgpt',
              chatType: 'private_ai',
              content: fullResponse,
              aiModel: 'gpt-4o',
            },
          });
          await prisma.userStats.upsert({
            where: { userId },
            update: { totalAiInteractions: { increment: 1 } },
            create: { userId, totalAiInteractions: 1 },
          });
          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }
  };

  return streamResponse();
}
