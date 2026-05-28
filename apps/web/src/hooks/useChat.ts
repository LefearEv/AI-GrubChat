// apps/web/src/hooks/useChat.ts
'use client';

import { useState, useCallback, useRef } from 'react';
import type { MessagePayload } from '@/lib/types';

interface StreamingMessage {
  id: string;
  provider: string;
  content: string;
  isStreaming: boolean;
}

export function useChat(groupId: string) {
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [streamingMessages, setStreamingMessages] = useState<Map<string, StreamingMessage>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // userId → username
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load riwayat pesan dari API
  const loadMessages = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('[useChat] Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // Handler: pesan baru masuk
  const handleNewMessage = useCallback((message: MessagePayload) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  // Handler: user sedang mengetik
  const handleUserTyping = useCallback(({ userId, username, isTyping }: {
    userId: string;
    username: string;
    isTyping: boolean;
  }) => {
    setTypingUsers((prev) => {
      const next = new Map(prev);
      if (isTyping) {
        next.set(userId, username);
        // Auto-clear setelah 3 detik jika tidak ada update
        const existing = typingTimeoutRef.current.get(userId);
        if (existing) clearTimeout(existing);
        const timeout = setTimeout(() => {
          setTypingUsers((p) => {
            const n = new Map(p);
            n.delete(userId);
            return n;
          });
        }, 3000);
        typingTimeoutRef.current.set(userId, timeout);
      } else {
        next.delete(userId);
        const existing = typingTimeoutRef.current.get(userId);
        if (existing) clearTimeout(existing);
      }
      return next;
    });
  }, []);

  // Handler: AI mulai berpikir
  const handleAIThinking = useCallback(() => {
    setIsAIThinking(true);
  }, []);

  // Handler: AI mulai streaming
  const handleAIResponseStart = useCallback(({ messageId, provider }: {
    messageId: string;
    provider: string;
  }) => {
    setIsAIThinking(false);
    setStreamingMessages((prev) => {
      const next = new Map(prev);
      next.set(messageId, { id: messageId, provider, content: '', isStreaming: true });
      return next;
    });
  }, []);

  // Handler: chunk streaming dari AI
  const handleAIResponseChunk = useCallback(({ messageId, chunk }: {
    messageId: string;
    chunk: string;
  }) => {
    setStreamingMessages((prev) => {
      const next = new Map(prev);
      const existing = next.get(messageId);
      if (existing) {
        next.set(messageId, { ...existing, content: existing.content + chunk });
      }
      return next;
    });
  }, []);

  // Handler: AI selesai streaming
  const handleAIResponseEnd = useCallback(({ messageId, savedMessageId, fullContent, provider }: {
    messageId: string;
    savedMessageId: string;
    fullContent: string;
    provider: string;
  }) => {
    // Hapus dari streaming messages
    setStreamingMessages((prev) => {
      const next = new Map(prev);
      next.delete(messageId);
      return next;
    });

    // Tambahkan sebagai pesan permanen
    const aiMessage: MessagePayload = {
      id: savedMessageId,
      groupId,
      senderId: null,
      senderType: provider === 'gemini' ? 'ai_gemini' : 'ai_chatgpt',
      chatType: 'group',
      recipientId: null,
      content: fullContent,
      aiModel: provider === 'gemini' ? 'gemini-1.5-pro' : 'gpt-4o',
      aiPromptRef: null,
      mentions: [],
      isDeleted: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      sender: null,
    };

    setMessages((prev) => [...prev, aiMessage]);
  }, [groupId]);

  return {
    messages,
    streamingMessages,
    typingUsers,
    isAIThinking,
    isLoading,
    loadMessages,
    handleNewMessage,
    handleUserTyping,
    handleAIThinking,
    handleAIResponseStart,
    handleAIResponseChunk,
    handleAIResponseEnd,
  };
}
