// apps/socket-server/src/handlers/groupHandler.ts
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../lib/constants';
import { PrismaClient } from '@prisma/client';
import { userSocketMap } from './p2pHandler';

const prisma = new PrismaClient();

export function registerGroupHandlers(io: Server, socket: Socket) {
  const user = (socket as any).user;

  // User bergabung ke room grup
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (groupId: string) => {
    if (!groupId) return;
    socket.join(groupId);
    console.log(`[Group] ${user.username} joined room: ${groupId}`);
  });

  // User meninggalkan room grup
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (groupId: string) => {
    if (!groupId) return;
    socket.leave(groupId);
    console.log(`[Group] ${user.username} left room: ${groupId}`);
  });
}

/**
 * Emit GROUP_MEMBER_ADDED ke user tertentu yang baru diundang
 * Dipanggil dari API route setelah invite berhasil
 */
export function notifyGroupMemberAdded(
  io: Server,
  targetUserId: string,
  group: { id: string; name: string; avatarUrl: string | null; memberCount: number }
) {
  const socketId = userSocketMap.get(targetUserId);
  if (socketId) {
    io.to(socketId).emit(SOCKET_EVENTS.GROUP_MEMBER_ADDED, { groupId: group.id, group });
  }
}

/**
 * Emit GROUP_CREATED ke semua member grup baru
 */
export function notifyGroupCreated(
  io: Server,
  memberUserIds: string[],
  group: any
) {
  for (const userId of memberUserIds) {
    const socketId = userSocketMap.get(userId);
    if (socketId) {
      io.to(socketId).emit(SOCKET_EVENTS.GROUP_CREATED, group);
    }
  }
}

/**
 * Emit GROUP_UPDATED ke semua member grup (misal lastMessage berubah)
 */
export function notifyGroupUpdated(
  io: Server,
  groupId: string,
  update: any
) {
  io.to(groupId).emit(SOCKET_EVENTS.GROUP_UPDATED, update);
}

/**
 * Emit GROUP_MEMBER_REMOVED ke user yang dikeluarkan
 */
export function notifyGroupMemberRemoved(
  io: Server,
  targetUserId: string,
  groupId: string
) {
  const socketId = userSocketMap.get(targetUserId);
  if (socketId) {
    io.to(socketId).emit(SOCKET_EVENTS.GROUP_MEMBER_REMOVED, { groupId });
  }
}
