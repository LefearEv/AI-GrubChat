// apps/web/src/app/api/p2p/[friendId]/route.ts
// Ambil riwayat P2P chat dengan seorang teman
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { friendId: string } }
) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { friendId } = params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = 50;

  // Verifikasi pertemanan
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: friendId },
        { requesterId: friendId, addresseeId: userId },
      ],
      status: 'accepted',
    },
  });

  if (!friendship) {
    return NextResponse.json({ error: 'Bukan teman' }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: {
      chatType: 'p2p',
      isDeleted: false,
      OR: [
        { senderId: userId, recipientId: friendId },
        { senderId: friendId, recipientId: userId },
      ],
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: {
        select: { id: true, publicId: true, username: true, avatarUrl: true },
      },
    },
  });

  const ordered = messages.reverse();
  const nextCursor = messages.length === limit ? messages[0].createdAt.toISOString() : null;

  return NextResponse.json({ messages: ordered, nextCursor });
}
