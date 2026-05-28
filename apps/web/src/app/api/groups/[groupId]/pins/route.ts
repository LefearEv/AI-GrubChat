// apps/web/src/app/api/groups/[groupId]/pins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Ambil semua pinned messages di grup
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAuth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = params;

  const pins = await prisma.pinnedMessage.findMany({
    where: { groupId },
    orderBy: { pinnedAt: 'desc' },
    include: {
      message: {
        include: {
          sender: {
            select: { username: true },
          },
        },
      },
      pinner: {
        select: { username: true },
      },
    },
  });

  const formatted = pins.map((pin) => ({
    id: pin.id,
    messageId: pin.messageId,
    content: pin.message.content,
    senderName: pin.message.sender?.username ?? pin.message.senderType,
    pinnedBy: pin.pinner.username,
    pinnedAt: pin.pinnedAt.toISOString(),
  }));

  return NextResponse.json({ pins: formatted });
}

// POST: Pin sebuah pesan
export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAuth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = params;
  const { messageId } = await req.json();

  if (!messageId) {
    return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
  }

  const userId = (session.user as any).id;

  // Verifikasi user adalah anggota grup
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pin = await prisma.pinnedMessage.upsert({
    where: { groupId_messageId: { groupId, messageId } },
    update: {},
    create: { groupId, messageId, pinnedBy: userId },
  });

  return NextResponse.json({ pin }, { status: 201 });
}

// DELETE: Unpin pesan
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAuth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = params;
  const { messageId } = await req.json();

  await prisma.pinnedMessage.deleteMany({
    where: { groupId, messageId },
  });

  return NextResponse.json({ success: true });
}
