// apps/socket-server/src/handlers/p2pHandler.ts
// Menangani P2P chat antar user (seperti WhatsApp DM)
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../lib/constants';
import { saveMessage } from '../services/messageService';
interface P2PMessagePayload {
  recipientId: string;
  content: string;
}

// Map userId → socketId untuk routing P2P
const userSocketMap = new Map<string, string>();

export function registerP2PHandlers(io: Server, socket: Socket) {
  const user = (socket as any).user;

  // Daftarkan socket user ini
  userSocketMap.set(user.id, socket.id);

  // Kirim pesan P2P
  socket.on('p2p_message', async (payload: P2PMessagePayload) => {
    const { recipientId, content } = payload;

    if (!content?.trim() || !recipientId) return;

    try {
      const message = await saveMessage({
        senderId: user.id,
        senderType: 'user',
        chatType: 'p2p',
        recipientId,
        content: content.trim(),
        mentions: [],
      });

      const messageData = {
        ...message,
        sender: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl ?? null,
        },
      };

      // Kirim ke pengirim
      socket.emit('p2p_new_message', messageData);

      // Kirim ke penerima jika online
      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('p2p_new_message', messageData);
      }
      // Jika offline, notifikasi akan dibuat via DB (bisa ditambahkan di sini)
    } catch (err) {
      console.error('[P2P] Error sending message:', err);
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Gagal mengirim pesan' });
    }
  });

  // Typing indicator P2P
  socket.on('p2p_typing_start', (recipientId: string) => {
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('p2p_user_typing', {
        userId: user.id,
        username: user.username,
        isTyping: true,
      });
    }
  });

  socket.on('p2p_typing_stop', (recipientId: string) => {
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('p2p_user_typing', {
        userId: user.id,
        username: user.username,
        isTyping: false,
      });
    }
  });

  // Bersihkan saat disconnect
  socket.on('disconnect', () => {
    userSocketMap.delete(user.id);
  });
}

// Export untuk digunakan di notifikasi
export { userSocketMap };

/**
 * Kirim friend request notification ke target user
 */
export function notifyFriendRequest(
  io: Server,
  targetUserId: string,
  request: any
) {
  const socketId = userSocketMap.get(targetUserId);
  if (socketId) {
    io.to(socketId).emit(SOCKET_EVENTS.FRIEND_REQUEST_RECEIVED, request);
  }
}

/**
 * Kirim notifikasi friend request diterima ke requester
 */
export function notifyFriendRequestAccepted(
  io: Server,
  targetUserId: string,
  payload: any
) {
  const socketId = userSocketMap.get(targetUserId);
  if (socketId) {
    io.to(socketId).emit(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, payload);
  }
}
