// apps/web/src/app/api/groups/[groupId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAuth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

  // Verifikasi user adalah anggota grup
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: (session.user as any).id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: {
      groupId,
      isDeleted: false,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: {
        select: {
          id: true,
          publicId: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  const ordered = messages.reverse();
  const nextCursor = messages.length === limit ? messages[0].createdAt.toISOString() : null;

  return NextResponse.json({ messages: ordered, nextCursor });
}
