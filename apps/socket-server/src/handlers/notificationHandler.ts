// apps/socket-server/src/handlers/notificationHandler.ts
// Push notifikasi real-time ke user yang online
import { Server, Socket } from 'socket.io';
import { userSocketMap } from './p2pHandler';

export function registerNotificationHandlers(io: Server, socket: Socket) {
  const user = (socket as any).user;

  // Tandai notifikasi sebagai dibaca
  socket.on('mark_notifications_read', () => {
    // Ini hanya event acknowledgment — actual DB update dilakukan via REST API
    socket.emit('notifications_marked_read', { success: true });
  });
}

/**
 * Push notifikasi real-time ke user tertentu (dipanggil dari handler lain)
 */
export function pushNotification(
  io: Server,
  targetUserId: string,
  notification: {
    type: string;
    payload: Record<string, any>;
  }
) {
  const socketId = userSocketMap.get(targetUserId);
  if (socketId) {
    io.to(socketId).emit('new_notification', {
      ...notification,
      createdAt: new Date().toISOString(),
    });
  }
}
