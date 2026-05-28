// apps/socket-server/src/handlers/chatHandler.ts
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../lib/constants';
import { saveMessage } from '../services/messageService';
import { detectAIMention } from '../services/aiDetectionService';
import type { MentionData } from '../lib/types';

interface SendMessagePayload {
  groupId: string;
  content: string;
  chatType: 'group' | 'p2p';
  recipientId?: string;
  mentions?: MentionData[];
}

export function registerChatHandlers(io: Server, socket: Socket) {
  const user = (socket as any).user;

  // Kirim pesan baru
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (payload: SendMessagePayload) => {
    try {
      const { groupId, content, chatType, recipientId, mentions = [] } = payload;

      if (!content?.trim()) return;

      // Simpan pesan user ke database
      const message = await saveMessage({
        groupId,
        senderId: user.id,
        senderType: 'user',
        chatType,
        recipientId,
        content: content.trim(),
        mentions,
      });

      const messageData = {
        ...message,
        sender: {
          id: user.id,
          username: user.username,
          publicId: user.publicId,
          avatarUrl: user.avatarUrl,
        },
      };

      // Kirim ke pengirim sendiri
      socket.emit(SOCKET_EVENTS.NEW_MESSAGE, messageData);

      // Broadcast ke anggota lain di room
      socket.to(groupId).emit(SOCKET_EVENTS.NEW_MESSAGE, messageData);

      // Update lastMessage di sidebar semua anggota grup secara real-time
      io.to(groupId).emit(SOCKET_EVENTS.GROUP_UPDATED, {
        id: groupId,
        lastMessage: {
          content: content.trim(),
          senderType: 'user',
          sender: { username: user.username },
        },
      });

      // Cek apakah ada mention ke AI (@Gemini atau @ChatGPT)
      const aiMention = detectAIMention(content);
      if (aiMention && chatType === 'group') {
        // Trigger AI response — ditangani oleh aiHandler
        socket.emit('__trigger_ai__', {
          groupId,
          triggerMessageId: message.id,
          aiProvider: aiMention.provider,
          content,
        });
      }
    } catch (err) {
      console.error('[Chat] Error sending message:', err);
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to send message' });
    }
  });

  // Indikator typing
  socket.on(SOCKET_EVENTS.TYPING_START, (groupId: string) => {
    socket.to(groupId).emit(SOCKET_EVENTS.USER_TYPING, {
      groupId,
      userId: user.id,
      username: user.username,
      isTyping: true,
    });
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, (groupId: string) => {
    socket.to(groupId).emit(SOCKET_EVENTS.USER_TYPING, {
      groupId,
      userId: user.id,
      username: user.username,
      isTyping: false,
    });
  });

  // Pin / Unpin pesan
  socket.on(SOCKET_EVENTS.PIN_MESSAGE, async ({ groupId, messageId }: { groupId: string; messageId: string }) => {
    try {
      // TODO: Simpan pin ke database
      io.to(groupId).emit(SOCKET_EVENTS.MESSAGE_PINNED, {
        groupId,
        messageId,
        pinnedBy: user.id,
      });
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to pin message' });
    }
  });

  socket.on(SOCKET_EVENTS.UNPIN_MESSAGE, async ({ groupId, messageId }: { groupId: string; messageId: string }) => {
    try {
      // TODO: Hapus pin dari database
      io.to(groupId).emit(SOCKET_EVENTS.MESSAGE_UNPINNED, { groupId, messageId });
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to unpin message' });
    }
  });
}
