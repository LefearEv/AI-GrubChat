// apps/web/src/components/chat/ChatWindow.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useSocket } from '@/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { PinnedMessages } from './PinnedMessages';
import { GroupMembersPanel } from './GroupMembersPanel';

interface ChatWindowProps {
  groupId: string;
  groupName: string;
  currentUserId: string;
  currentUserRole?: string;
}

export function ChatWindow({
  groupId,
  groupName,
  currentUserId,
  currentUserRole = 'member',
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showMembers, setShowMembers] = useState(false);

  const {
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
  } = useChat(groupId);

  const { sendMessage, startTyping, stopTyping, pinMessage, unpinMessage } = useSocket({
    groupId,
    onNewMessage: handleNewMessage,
    onUserTyping: handleUserTyping,
    onAIThinking: handleAIThinking,
    onAIResponseStart: handleAIResponseStart,
    onAIResponseChunk: handleAIResponseChunk,
    onAIResponseEnd: handleAIResponseEnd,
  });

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessages]);

  const handleSend = (content: string, mentions: any[]) => {
    sendMessage({ groupId, content, chatType: 'group', mentions });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
            {groupName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{groupName}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Grup Chat</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <PinnedMessages groupId={groupId} />
          <button
            onClick={() => setShowMembers(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Lihat anggota"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium">Anggota</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Belum ada pesan. Mulai percakapan!
                </p>
                <p className="text-xs text-indigo-400 mt-2">
                  Ketik <code className="bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">@Gemini</code> atau{' '}
                  <code className="bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">@ChatGPT</code> untuk memanggil AI
                </p>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                onPin={() => pinMessage(groupId, message.id)}
                onUnpin={() => unpinMessage(groupId, message.id)}
              />
            ))}

            {/* Streaming AI messages */}
            {Array.from(streamingMessages.values()).map((streaming) => (
              <div key={streaming.id} className="flex items-start gap-2 py-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1"
                  style={{
                    backgroundColor: streaming.provider === 'gemini' ? '#4285F4' : '#10A37F',
                  }}
                >
                  {streaming.provider === 'gemini' ? 'G' : 'C'}
                </div>
                <div className="max-w-[70%] bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm">
                  <p className="text-xs font-semibold mb-1" style={{
                    color: streaming.provider === 'gemini' ? '#4285F4' : '#10A37F',
                  }}>
                    {streaming.provider === 'gemini' ? 'Gemini' : 'ChatGPT'}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {streaming.content}
                    <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse" />
                  </p>
                </div>
              </div>
            ))}

            {/* AI Thinking indicator */}
            {isAIThinking && (
              <div className="flex items-center gap-2 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                  AI
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <TypingIndicator users={Array.from(typingUsers.values())} />
      )}

      {/* Message Input */}
      <MessageInput
        groupId={groupId}
        onSend={handleSend}
        onTypingStart={() => startTyping(groupId)}
        onTypingStop={() => stopTyping(groupId)}
      />

      {/* Members Panel */}
      {showMembers && (
        <GroupMembersPanel
          groupId={groupId}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  );
}
