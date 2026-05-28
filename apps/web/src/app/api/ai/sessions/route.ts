// apps/web/src/app/api/ai/sessions/route.ts
// CRUD untuk Private AI Chat sessions
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET: Daftar semua sesi AI milik user
export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  const sessions = await prisma.aiSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, createdAt: true, senderType: true },
      },
    },
  });

  return NextResponse.json({ sessions });
}

// POST: Buat sesi AI baru
export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { provider } = await req.json();

  if (!['gemini', 'chatgpt'].includes(provider)) {
    return NextResponse.json({ error: 'Provider tidak valid' }, { status: 400 });
  }

  const aiSession = await prisma.aiSession.create({
    data: { userId, provider, title: 'Chat baru' },
  });

  return NextResponse.json({ session: aiSession }, { status: 201 });
}
