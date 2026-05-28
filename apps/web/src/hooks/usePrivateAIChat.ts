// apps/web/src/hooks/usePrivateAIChat.ts
'use client';

import { useState, useCallback, useRef } from 'react';

interface Message {
  id: string;
  senderType: 'user' | 'ai_gemini' | 'ai_chatgpt';
  content: string;
  createdAt: string;
}

interface StreamingState {
  isStreaming: boolean;
  content: string;
}

export function usePrivateAIChat(sessionId: string, provider: 'gemini' | 'chatgpt') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState<StreamingState>({ isStreaming: false, content: '' });
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ai/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || streaming.isStreaming) return;

    // Tambahkan pesan user ke UI langsung
    const userMsg: Message = {
      id: crypto.randomUUID(),
      senderType: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Mulai streaming
    setStreaming({ isStreaming: true, content: '' });
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: content, provider }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const { chunk } = JSON.parse(data);
            fullContent += chunk;
            setStreaming({ isStreaming: true, content: fullContent });
          } catch {
            // skip malformed chunk
          }
        }
      }

      // Streaming selesai — tambahkan sebagai pesan permanen
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        senderType: provider === 'gemini' ? 'ai_gemini' : 'ai_chatgpt',
        content: fullContent,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[usePrivateAIChat] Error:', err);
      }
    } finally {
      setStreaming({ isStreaming: false, content: '' });
    }
  }, [sessionId, provider, streaming.isStreaming]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, streaming, isLoading, loadMessages, sendMessage, stopStreaming };
}
