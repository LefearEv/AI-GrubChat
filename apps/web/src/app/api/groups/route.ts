// apps/web/src/app/api/groups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
});

// GET: Daftar grup yang diikuti user
export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              content: true,
              createdAt: true,
              senderType: true,
              sender: { select: { username: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const groups = memberships.map((m) => ({
    ...m.group,
    role: m.role,
    memberCount: m.group._count.members,
    lastMessage: m.group.messages[0] ?? null,
  }));

  return NextResponse.json({ groups });
}

// POST: Buat grup baru
export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      ...parsed.data,
      createdById: userId,
      members: {
        create: {
          userId,
          role: 'owner',
        },
      },
    },
  });

  return NextResponse.json({ group }, { status: 201 });
}
