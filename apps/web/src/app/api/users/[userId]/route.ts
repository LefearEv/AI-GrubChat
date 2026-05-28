// apps/web/src/app/api/users/[userId]/route.ts
// Public profile endpoint
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getAuth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = params;

  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      publicId: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
      stats: {
        select: {
          totalAiInteractions: true,
          totalMessages: true,
        },
      },
      groupMemberships: {
        where: {
          group: { isPublic: true },
        },
        select: {
          group: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    publicId: user.publicId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    joinedAt: user.createdAt,
    stats: {
      totalAiInteractions: user.stats?.totalAiInteractions ?? 0,
      totalMessages: user.stats?.totalMessages ?? 0,
      totalPublicGroups: user.groupMemberships.length,
    },
    publicGroups: user.groupMemberships.map((m) => m.group),
  });
}
