// apps/web/src/app/api/groups/[groupId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET: Detail grup
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupId } = params;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      _count: { select: { members: true } },
      members: {
        include: {
          user: { select: { id: true, publicId: true, username: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!group) return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 });

  return NextResponse.json({ group });
}

// PATCH: Update info grup (hanya owner/admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { groupId } = params;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership || membership.role === 'member') {
    return NextResponse.json({ error: 'Tidak punya izin' }, { status: 403 });
  }

  const body = await req.json();
  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const group = await prisma.group.update({
    where: { id: groupId },
    data: parsed.data,
  });

  return NextResponse.json({ group });
}

// DELETE: Hapus grup (hanya owner)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { groupId } = params;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (membership?.role !== 'owner') {
    return NextResponse.json({ error: 'Hanya owner yang bisa menghapus grup' }, { status: 403 });
  }

  await prisma.group.delete({ where: { id: groupId } });

  return NextResponse.json({ success: true });
}
