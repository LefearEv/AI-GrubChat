// apps/web/src/components/chat/PrivateAIChatWindow.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrivateAIChat } from '@/hooks/usePrivateAIChat';
import { AI_AGENTS } from '@/lib/constants';
import { formatChatTime } from '@/lib/utils';

interface PrivateAIChatWindowProps {
  sessionId: string;
  provider: 'gemini' | 'chatgpt';
  title: string;
}

export function PrivateAIChatWindow({ sessionId, provider, title }: PrivateAIChatWindowProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, streaming, isLoading, loadMessages, sendMessage, stopStreaming } =
    usePrivateAIChat(sessionId, provider);

  const aiConfig = provider === 'gemini' ? AI_AGENTS.GEMINI : AI_AGENTS.CHATGPT;

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming.content]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || streaming.isStreaming) return;
    sendMessage(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: aiConfig.avatarColor }}
        >
          {provider === 'gemini' ? 'G' : 'C'}
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
            {aiConfig.displayName}
          </h2>
          <p className="text-xs text-gray-400">{title}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : messages.length === 0 && !streaming.isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg"
              style={{ backgroundColor: aiConfig.avatarColor }}
            >
              {provider === 'gemini' ? 'G' : 'C'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Halo! Saya {aiConfig.displayName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Tanyakan apa saja — saya siap membantu kamu.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.senderType === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isUser && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1"
                      style={{ backgroundColor: aiConfig.avatarColor }}
                    >
                      {provider === 'gemini' ? 'G' : 'C'}
                    </div>
                  )}
                  <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-indigo-500 text-white rounded-br-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 mx-1">
                      {formatChatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Streaming response */}
            {streaming.isStreaming && (
              <div className="flex items-end gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1"
                  style={{ backgroundColor: aiConfig.avatarColor }}
                >
                  {provider === 'gemini' ? 'G' : 'C'}
                </div>
                <div className="max-w-[75%]">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                    {streaming.content ? (
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {streaming.content}
                        <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse" />
                      </p>
                    ) : (
                      <div className="flex gap-1 py-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
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
            placeholder={`Tanya ${aiConfig.displayName}...`}
            rows={1}
            disabled={streaming.isStreaming}
            className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />

          {streaming.isStreaming ? (
            <button
              onClick={stopStreaming}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
              title="Hentikan"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1.5 ml-1">
          Enter untuk kirim · Shift+Enter untuk baris baru
        </p>
      </div>
    </div>
  );
}
