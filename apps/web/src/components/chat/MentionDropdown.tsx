// apps/web/src/components/chat/MentionDropdown.tsx
'use client';

import { useEffect, useRef } from 'react';

interface MentionSuggestion {
  type: 'user' | 'ai';
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatarColor?: string;
}

interface MentionDropdownProps {
  suggestions: MentionSuggestion[];
  onSelect: (suggestion: MentionSuggestion) => void;
  onClose: () => void;
}

export function MentionDropdown({ suggestions, onSelect, onClose }: MentionDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-4 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
    >
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Mention
        </p>
      </div>
      <ul className="max-h-48 overflow-y-auto py-1">
        {suggestions.map((suggestion) => (
          <li key={`${suggestion.type}-${suggestion.id}`}>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              onClick={() => onSelect(suggestion)}
            >
              {/* Avatar */}
              {suggestion.avatarUrl ? (
                <img
                  src={suggestion.avatarUrl}
                  alt={suggestion.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: suggestion.avatarColor ?? '#6366f1',
                  }}
                >
                  {suggestion.username.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  @{suggestion.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {suggestion.type === 'ai' ? '🤖 AI Agent' : '👤 Member'}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
