// apps/web/src/app/api/groups/[groupId]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitToSocketServer } from '@/lib/socketEmitter';

// GET: Daftar anggota grup
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupId } = params;

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: { id: true, publicId: true, username: true, avatarUrl: true },
      },
    },
    orderBy: [
      { role: 'asc' }, // owner dulu
      { joinedAt: 'asc' },
    ],
  });

  return NextResponse.json({ members });
}

// POST: Invite user ke grup (by publicId atau username)
export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { groupId } = params;
  const { query } = await req.json(); // publicId atau username

  // Hanya owner/admin yang bisa invite
  const myMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!myMembership || myMembership.role === 'member') {
    return NextResponse.json({ error: 'Hanya admin/owner yang bisa mengundang' }, { status: 403 });
  }

  // Cari user target
  const targetUser = await prisma.user.findFirst({
    where: {
      OR: [{ publicId: query }, { username: query }],
      deletedAt: null,
    },
  });
  if (!targetUser) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

  // Cek sudah jadi anggota
  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUser.id } },
  });
  if (existing) return NextResponse.json({ error: 'User sudah menjadi anggota' }, { status: 409 });

  const member = await prisma.groupMember.create({
    data: { groupId, userId: targetUser.id, role: 'member' },
    include: {
      user: { select: { id: true, publicId: true, username: true, avatarUrl: true } },
    },
  });

  // Kirim notifikasi ke user yang diundang
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true, avatarUrl: true, _count: { select: { members: true } } },
  });
  await prisma.notification.create({
    data: {
      userId: targetUser.id,
      type: 'group_invite',
      payload: {
        groupId,
        groupName: group?.name,
        invitedBy: (session.user as any).username,
      },
    },
  });

  // Emit real-time agar grup langsung muncul di sidebar user yang diundang
  await emitToSocketServer('group_member_added', {
    targetUserId: targetUser.id,
    groupId,
    group: {
      id: groupId,
      name: group?.name,
      avatarUrl: group?.avatarUrl ?? null,
      memberCount: group?._count.members ?? 1,
      lastMessage: null,
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}

// DELETE: Kick member atau leave group
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { groupId } = params;
  const { targetUserId } = await req.json();

  const targetId = targetUserId ?? userId; // Jika tidak ada targetUserId, berarti leave

  if (targetId !== userId) {
    // Kick — hanya owner/admin
    const myMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!myMembership || myMembership.role === 'member') {
      return NextResponse.json({ error: 'Tidak punya izin' }, { status: 403 });
    }

    // Tidak bisa kick owner
    const targetMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetId } },
    });
    if (targetMembership?.role === 'owner') {
      return NextResponse.json({ error: 'Tidak bisa mengeluarkan owner' }, { status: 400 });
    }
  } else {
    // Leave — cek apakah owner
    const myMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (myMembership?.role === 'owner') {
      // Owner harus transfer ownership dulu atau hapus grup
      const memberCount = await prisma.groupMember.count({ where: { groupId } });
      if (memberCount > 1) {
        return NextResponse.json(
          { error: 'Transfer ownership ke anggota lain sebelum keluar' },
          { status: 400 }
        );
      }
      // Jika sendirian, hapus grup
      await prisma.group.delete({ where: { id: groupId } });
      return NextResponse.json({ success: true, groupDeleted: true });
    }
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: targetId } },
  });

  return NextResponse.json({ success: true });
}
