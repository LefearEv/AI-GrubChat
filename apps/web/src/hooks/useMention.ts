// apps/web/src/hooks/useMention.ts
'use client';

import { useState, useCallback } from 'react';
import { AI_AGENTS } from '@/lib/constants';

interface MentionSuggestion {
  type: 'user' | 'ai';
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatarColor?: string;
}

const AI_SUGGESTIONS: MentionSuggestion[] = [
  {
    type: 'ai',
    id: 'gemini',
    username: 'Gemini',
    displayName: 'Gemini AI',
    avatarColor: AI_AGENTS.GEMINI.avatarColor,
  },
  {
    type: 'ai',
    id: 'chatgpt',
    username: 'ChatGPT',
    displayName: 'ChatGPT',
    avatarColor: AI_AGENTS.CHATGPT.avatarColor,
  },
];

export function useMention(groupMembers: Array<{ id: string; username: string; avatarUrl?: string }>) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const detectMention = useCallback((text: string, cursor: number) => {
    // Cari @ sebelum posisi cursor
    const textBeforeCursor = text.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (!mentionMatch) {
      setIsOpen(false);
      setSuggestions([]);
      return;
    }

    const query = mentionMatch[1].toLowerCase();
    setMentionQuery(query);
    setCursorPosition(cursor);

    // Filter AI suggestions
    const aiMatches = AI_SUGGESTIONS.filter((s) =>
      s.username.toLowerCase().startsWith(query)
    );

    // Filter user suggestions
    const userMatches = groupMembers
      .filter((m) => m.username.toLowerCase().startsWith(query))
      .map((m) => ({
        type: 'user' as const,
        id: m.id,
        username: m.username,
        displayName: m.username,
        avatarUrl: m.avatarUrl,
      }));

    const allSuggestions = [...aiMatches, ...userMatches];
    setSuggestions(allSuggestions);
    setIsOpen(allSuggestions.length > 0);
  }, [groupMembers]);

  const selectMention = useCallback((
    suggestion: MentionSuggestion,
    currentText: string
  ): string => {
    const textBeforeCursor = currentText.slice(0, cursorPosition);
    const textAfterCursor = currentText.slice(cursorPosition);

    // Ganti @query dengan @username yang dipilih
    const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${suggestion.username} `);
    const newText = newTextBefore + textAfterCursor;

    setIsOpen(false);
    setSuggestions([]);
    return newText;
  }, [cursorPosition]);

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isOpen,
    mentionQuery,
    detectMention,
    selectMention,
    closeSuggestions,
  };
}
