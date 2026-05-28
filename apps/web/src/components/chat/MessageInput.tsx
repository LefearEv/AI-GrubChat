// apps/web/src/components/chat/MessageInput.tsx
'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { useMention } from '@/hooks/useMention';
import { MentionDropdown } from './MentionDropdown';

interface MessageInputProps {
  groupId: string;
  onSend: (content: string, mentions: any[]) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  groupMembers?: Array<{ id: string; username: string; avatarUrl?: string }>;
}

export function MessageInput({
  groupId,
  onSend,
  onTypingStart,
  onTypingStop,
  groupMembers = [],
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const { suggestions, isOpen, detectMention, selectMention, closeSuggestions } = useMention(groupMembers);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Deteksi @mention
    detectMention(value, e.target.selectionStart ?? value.length);

    // Typing indicator logic
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart();
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingStop();
    }, 1500);

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Extract mentions dari konten
    const mentions: any[] = [];
    const mentionPattern = /@(\w+)/g;
    let match;
    while ((match = mentionPattern.exec(trimmed)) !== null) {
      const username = match[1];
      if (username === 'Gemini') {
        mentions.push({ type: 'ai', id: 'gemini', username: 'Gemini' });
      } else if (username === 'ChatGPT') {
        mentions.push({ type: 'ai', id: 'chatgpt', username: 'ChatGPT' });
      } else {
        const member = groupMembers.find((m) => m.username === username);
        if (member) {
          mentions.push({ type: 'user', id: member.id, username: member.username });
        }
      }
    }

    onSend(trimmed, mentions);
    setContent('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Stop typing
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [content, groupMembers, onSend, onTypingStop]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter untuk kirim (Shift+Enter untuk newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isOpen) return; // Jangan kirim jika dropdown mention terbuka
      handleSend();
    }

    // Escape untuk tutup mention dropdown
    if (e.key === 'Escape') {
      closeSuggestions();
    }
  };

  const handleSelectMention = (suggestion: any) => {
    const newContent = selectMention(suggestion, content);
    setContent(newContent);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Mention Dropdown */}
      {isOpen && (
        <MentionDropdown
          suggestions={suggestions}
          onSelect={handleSelectMention}
          onClose={closeSuggestions}
        />
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan... Gunakan @Gemini atau @ChatGPT untuk memanggil AI"
            rows={1}
            className="w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white flex items-center justify-center transition-colors"
          aria-label="Kirim pesan"
        >
          <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-1.5 ml-1">
        Enter untuk kirim · Shift+Enter untuk baris baru · @Gemini / @ChatGPT untuk memanggil AI
      </p>
    </div>
  );
}
