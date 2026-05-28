// apps/web/src/hooks/useSocket.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { SOCKET_EVENTS } from '@/lib/constants';
import type { MessagePayload, TypingPayload } from '@/lib/types';

interface UseSocketOptions {
  groupId?: string;
  onNewMessage?: (message: MessagePayload) => void;
  onUserTyping?: (payload: TypingPayload) => void;
  onAIThinking?: (payload: { groupId: string; provider: string }) => void;
  onAIResponseStart?: (payload: { groupId: string; messageId: string; provider: string }) => void;
  onAIResponseChunk?: (payload: { groupId: string; messageId: string; chunk: string }) => void;
  onAIResponseEnd?: (payload: { groupId: string; messageId: string; savedMessageId: string; fullContent: string }) => void;
  onMessagePinned?: (payload: { groupId: string; messageId: string; pinnedBy: string }) => void;
  onP2PMessage?: (message: any) => void;
  onP2PTyping?: (payload: { userId: string; username: string; isTyping: boolean }) => void;
  onNewNotification?: (notification: any) => void;
  // Sidebar real-time events
  onGroupCreated?: (group: any) => void;
  onGroupUpdated?: (group: any) => void;
  onGroupMemberAdded?: (payload: { groupId: string; group: any }) => void;
  onGroupMemberRemoved?: (payload: { groupId: string }) => void;
  onFriendRequestReceived?: (request: any) => void;
  onFriendRequestAccepted?: (payload: any) => void;
}

// Singleton socket
let globalSocket: Socket | null = null;

function getSocket(userId: string, username: string): Socket {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket?.disconnect();
    globalSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: { userId, username },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return globalSocket;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const currentGroupRef = useRef<string | null>(null);

  // Selalu pakai ref terbaru untuk callbacks — hindari stale closure
  const onNewMessage = useRef(options.onNewMessage);
  const onUserTyping = useRef(options.onUserTyping);
  const onAIThinking = useRef(options.onAIThinking);
  const onAIResponseStart = useRef(options.onAIResponseStart);
  const onAIResponseChunk = useRef(options.onAIResponseChunk);
  const onAIResponseEnd = useRef(options.onAIResponseEnd);
  const onMessagePinned = useRef(options.onMessagePinned);
  const onP2PMessage = useRef(options.onP2PMessage);
  const onP2PTyping = useRef(options.onP2PTyping);
  const onNewNotification = useRef(options.onNewNotification);
  const onGroupCreated = useRef(options.onGroupCreated);
  const onGroupUpdated = useRef(options.onGroupUpdated);
  const onGroupMemberAdded = useRef(options.onGroupMemberAdded);
  const onGroupMemberRemoved = useRef(options.onGroupMemberRemoved);
  const onFriendRequestReceived = useRef(options.onFriendRequestReceived);
  const onFriendRequestAccepted = useRef(options.onFriendRequestAccepted);

  // Update refs setiap render
  onNewMessage.current = options.onNewMessage;
  onUserTyping.current = options.onUserTyping;
  onAIThinking.current = options.onAIThinking;
  onAIResponseStart.current = options.onAIResponseStart;
  onAIResponseChunk.current = options.onAIResponseChunk;
  onAIResponseEnd.current = options.onAIResponseEnd;
  onMessagePinned.current = options.onMessagePinned;
  onP2PMessage.current = options.onP2PMessage;
  onP2PTyping.current = options.onP2PTyping;
  onNewNotification.current = options.onNewNotification;
  onGroupCreated.current = options.onGroupCreated;
  onGroupUpdated.current = options.onGroupUpdated;
  onGroupMemberAdded.current = options.onGroupMemberAdded;
  onGroupMemberRemoved.current = options.onGroupMemberRemoved;
  onFriendRequestReceived.current = options.onFriendRequestReceived;
  onFriendRequestAccepted.current = options.onFriendRequestAccepted;

  // Inisialisasi socket
  useEffect(() => {
    if (!session?.user) return;

    const userId = (session.user as any).id;
    const username = (session.user as any).username;
    if (!userId || !username) return;

    const socket = getSocket(userId, username);
    socketRef.current = socket;

    const handleConnect = () => {
      console.log('[Socket] Connected:', socket.id);
      if (currentGroupRef.current) {
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, currentGroupRef.current);
      }
    };

    const handleConnectError = (err: Error) => {
      console.error('[Socket] Connection error:', err.message);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);

    // Pasang semua event listeners dengan ref — tidak pernah stale
    const handlers: Record<string, (...args: any[]) => void> = {
      [SOCKET_EVENTS.NEW_MESSAGE]: (msg) => onNewMessage.current?.(msg),
      [SOCKET_EVENTS.USER_TYPING]: (p) => onUserTyping.current?.(p),
      [SOCKET_EVENTS.AI_THINKING]: (p) => onAIThinking.current?.(p),
      [SOCKET_EVENTS.AI_RESPONSE_START]: (p) => onAIResponseStart.current?.(p),
      [SOCKET_EVENTS.AI_RESPONSE_CHUNK]: (p) => onAIResponseChunk.current?.(p),
      [SOCKET_EVENTS.AI_RESPONSE_END]: (p) => onAIResponseEnd.current?.(p),
      [SOCKET_EVENTS.MESSAGE_PINNED]: (p) => onMessagePinned.current?.(p),
      'p2p_new_message': (msg) => onP2PMessage.current?.(msg),
      'p2p_user_typing': (p) => onP2PTyping.current?.(p),
      'new_notification': (n) => onNewNotification.current?.(n),
      [SOCKET_EVENTS.GROUP_CREATED]: (g) => onGroupCreated.current?.(g),
      [SOCKET_EVENTS.GROUP_UPDATED]: (g) => onGroupUpdated.current?.(g),
      [SOCKET_EVENTS.GROUP_MEMBER_ADDED]: (p) => onGroupMemberAdded.current?.(p),
      [SOCKET_EVENTS.GROUP_MEMBER_REMOVED]: (p) => onGroupMemberRemoved.current?.(p),
      [SOCKET_EVENTS.FRIEND_REQUEST_RECEIVED]: (r) => onFriendRequestReceived.current?.(r),
      [SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED]: (p) => onFriendRequestAccepted.current?.(p),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [session]);

  // Join/leave room saat groupId berubah
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !options.groupId) return;

    if (currentGroupRef.current && currentGroupRef.current !== options.groupId) {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, currentGroupRef.current);
    }

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, options.groupId);
    currentGroupRef.current = options.groupId;

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, options.groupId);
      currentGroupRef.current = null;
    };
  }, [options.groupId]);

  // ── Group Chat Actions ──────────────────────────────────────────
  const sendMessage = useCallback((payload: {
    groupId: string;
    content: string;
    chatType: 'group' | 'p2p';
    recipientId?: string;
    mentions?: any[];
  }) => {
    socketRef.current?.emit(SOCKET_EVENTS.SEND_MESSAGE, payload);
  }, []);

  const startTyping = useCallback((gId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.TYPING_START, gId);
  }, []);

  const stopTyping = useCallback((gId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.TYPING_STOP, gId);
  }, []);

  const pinMessage = useCallback((groupId: string, messageId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.PIN_MESSAGE, { groupId, messageId });
  }, []);

  const unpinMessage = useCallback((groupId: string, messageId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.UNPIN_MESSAGE, { groupId, messageId });
  }, []);

  // ── P2P Actions ─────────────────────────────────────────────────
  const sendP2PMessage = useCallback((recipientId: string, content: string) => {
    socketRef.current?.emit('p2p_message', { recipientId, content });
  }, []);

  const startP2PTyping = useCallback((recipientId: string) => {
    socketRef.current?.emit('p2p_typing_start', recipientId);
  }, []);

  const stopP2PTyping = useCallback((recipientId: string) => {
    socketRef.current?.emit('p2p_typing_stop', recipientId);
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    sendMessage,
    startTyping,
    stopTyping,
    pinMessage,
    unpinMessage,
    sendP2PMessage,
    startP2PTyping,
    stopP2PTyping,
  };
}
