// apps/web/src/app/api/ai/sessions/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Ambil pesan dalam sesi
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { sessionId } = params;

  const aiSession = await prisma.aiSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!aiSession) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });

  return NextResponse.json({ session: aiSession, messages: aiSession.messages });
}

// PATCH: Update judul sesi
export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { title } = await req.json();

  const aiSession = await prisma.aiSession.updateMany({
    where: { id: params.sessionId, userId },
    data: { title },
  });

  return NextResponse.json({ success: true });
}

// DELETE: Hapus sesi
export async function DELETE(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  await prisma.aiSession.deleteMany({
    where: { id: params.sessionId, userId },
  });

  return NextResponse.json({ success: true });
}
