// apps/web/src/components/chat/MessageBubble.tsx
'use client';

import { useState } from 'react';
import { formatChatTime } from '@/lib/utils';
import { AI_AGENTS } from '@/lib/constants';
import type { MessagePayload } from '@/lib/types';

interface MessageBubbleProps {
  message: MessagePayload;
  isOwn: boolean;
  onPin: () => void;
  onUnpin: () => void;
}

export function MessageBubble({ message, isOwn, onPin, onUnpin }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const isAI = message.senderType === 'ai_gemini' || message.senderType === 'ai_chatgpt';
  const isGemini = message.senderType === 'ai_gemini';
  const isChatGPT = message.senderType === 'ai_chatgpt';

  const aiConfig = isGemini ? AI_AGENTS.GEMINI : AI_AGENTS.CHATGPT;

  // Render konten dengan highlight @mention
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const isAIMention = part === '@Gemini' || part === '@ChatGPT';
        return (
          <span
            key={i}
            className={`font-semibold ${
              isAIMention
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (isAI) {
    return (
      <div
        className="flex items-start gap-2 py-1 group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* AI Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1"
          style={{ backgroundColor: aiConfig.avatarColor }}
        >
          {isGemini ? 'G' : 'C'}
        </div>

        <div className="max-w-[70%]">
          <p className="text-xs font-semibold mb-1" style={{ color: aiConfig.avatarColor }}>
            {aiConfig.displayName}
            <span className="ml-2 text-gray-400 font-normal">{message.aiModel}</span>
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {renderContent(message.content)}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-1">
            {formatChatTime(message.createdAt)}
          </p>
        </div>

        {/* Action buttons */}
        {showActions && (
          <button
            onClick={onPin}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
            title="Pin pesan"
          >
            📌
          </button>
        )}
      </div>
    );
  }

  // Pesan dari user
  return (
    <div
      className={`flex items-end gap-2 py-0.5 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* User Avatar */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mb-4">
          {message.sender?.username?.charAt(0).toUpperCase() ?? '?'}
        </div>
      )}

      <div className={`max-w-[65%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 ml-1">
            {message.sender?.username}
          </p>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-indigo-500 text-white rounded-br-sm'
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {renderContent(message.content)}
          </p>
        </div>
        <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
          {formatChatTime(message.createdAt)}
        </p>
      </div>

      {/* Action buttons */}
      {showActions && (
        <button
          onClick={onPin}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 mb-4"
          title="Pin pesan"
        >
          📌
        </button>
      )}
    </div>
  );
}
