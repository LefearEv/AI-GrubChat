// apps/web/src/app/api/friends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { emitToSocketServer } from '@/lib/socketEmitter';

// GET: Daftar teman (accepted) dan permintaan pending
export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const [friends, pendingReceived] = await Promise.all([
    // Teman yang sudah accepted
    prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
        status: 'accepted',
      },
      include: {
        requester: { select: { id: true, publicId: true, username: true, avatarUrl: true } },
        addressee: { select: { id: true, publicId: true, username: true, avatarUrl: true } },
      },
    }),
    // Permintaan pertemanan yang diterima (belum direspons)
    prisma.friendship.findMany({
      where: { addresseeId: userId, status: 'pending' },
      include: {
        requester: { select: { id: true, publicId: true, username: true, avatarUrl: true } },
      },
    }),
  ]);

  const friendList = friends.map((f) => ({
    friendshipId: f.id,
    friend: f.requesterId === userId ? f.addressee : f.requester,
  }));

  return NextResponse.json({ friends: friendList, pendingRequests: pendingReceived });
}

// POST: Kirim permintaan pertemanan (by publicId atau username)
export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { query } = await req.json(); // publicId atau username

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  // Cari user berdasarkan publicId atau username
  const targetUser = await prisma.user.findFirst({
    where: {
      OR: [{ publicId: query }, { username: query }],
      deletedAt: null,
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
  }

  if (targetUser.id === userId) {
    return NextResponse.json({ error: 'Tidak bisa menambah diri sendiri' }, { status: 400 });
  }

  // Cek apakah sudah ada friendship
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: targetUser.id },
        { requesterId: targetUser.id, addresseeId: userId },
      ],
    },
  });

  if (existing) {
    const statusMap: Record<string, string> = {
      accepted: 'Sudah berteman',
      pending: 'Permintaan sudah dikirim',
      blocked: 'Tidak dapat menambah user ini',
    };
    return NextResponse.json({ error: statusMap[existing.status] }, { status: 409 });
  }

  const friendship = await prisma.friendship.create({
    data: {
      requesterId: userId,
      addresseeId: targetUser.id,
      status: 'pending',
    },
  });

  // Buat notifikasi untuk target user
  await prisma.notification.create({
    data: {
      userId: targetUser.id,
      type: 'friend_request',
      payload: {
        friendshipId: friendship.id,
        fromUserId: userId,
        fromUsername: (session.user as any).username,
      },
    },
  });

  // Emit real-time ke target user agar friend request langsung muncul
  await emitToSocketServer('friend_request_received', {
    targetUserId: targetUser.id,
    id: friendship.id,
    requester: {
      id: userId,
      username: (session.user as any).username,
      publicId: (session.user as any).publicId,
      avatarUrl: (session.user as any).avatarUrl ?? null,
    },
  });

  return NextResponse.json({ friendship }, { status: 201 });
}

// PATCH: Terima atau tolak permintaan pertemanan
export async function PATCH(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { friendshipId, action } = await req.json(); // action: 'accept' | 'reject'

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship || friendship.addresseeId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (action === 'accept') {
    await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
    });

    // Emit real-time ke requester agar teman baru langsung muncul di FriendList
    const accepter = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, publicId: true, username: true, avatarUrl: true },
    });
    await emitToSocketServer('friend_request_accepted', {
      targetUserId: friendship.requesterId,
      friendshipId,
      friend: {
        friendshipId,
        id: userId,
        ...accepter,
      },
    });
  } else {
    await prisma.friendship.delete({ where: { id: friendshipId } });
  }

  return NextResponse.json({ success: true });
}
