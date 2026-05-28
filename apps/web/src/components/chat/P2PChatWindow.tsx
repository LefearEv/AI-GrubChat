// apps/web/src/components/chat/P2PChatWindow.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { formatChatTime } from '@/lib/utils';

interface P2PChatWindowProps {
  friendId: string;
  friendUsername: string;
  friendAvatarUrl: string | null;
  currentUserId: string;
}

export function P2PChatWindow({
  friendId,
  friendUsername,
  friendAvatarUrl,
  currentUserId,
}: P2PChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const handleP2PMessage = useCallback((msg: any) => {
    setMessages((prev) => {
      // Deduplicate
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const handleP2PTyping = useCallback(({ userId, isTyping: typing }: any) => {
    if (userId === friendId) setIsTyping(typing);
  }, [friendId]);

  const { sendP2PMessage, startP2PTyping, stopP2PTyping } = useSocket({
    onP2PMessage: handleP2PMessage,
    onP2PTyping: handleP2PTyping,
  });

  // Load riwayat pesan
  useEffect(() => {
    fetch(`/api/p2p/${friendId}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .finally(() => setIsLoading(false));
  }, [friendId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    sendP2PMessage(friendId, trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    if (isTypingRef.current) {
      isTypingRef.current = false;
      stopP2PTyping(friendId);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      startP2PTyping(friendId);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      stopP2PTyping(friendId);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-semibold text-sm">
            {friendUsername.charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white dark:border-gray-800" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{friendUsername}</h2>
          <p className="text-xs text-gray-400">{isTyping ? 'sedang mengetik...' : 'Online'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Mulai percakapan dengan <strong>{friendUsername}</strong>
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
              onPin={() => {}}
              onUnpin={() => {}}
            />
          ))
        )}

        {isTyping && <TypingIndicator users={[friendUsername]} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Pesan ke ${friendUsername}...`}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
