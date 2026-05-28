// apps/web/src/components/sidebar/ChatHistory.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AI_AGENTS } from '@/lib/constants';
import { truncate } from '@/lib/utils';

interface AiSession {
  id: string;
  provider: string;
  title: string;
  updatedAt: string;
  messages: Array<{ content: string; senderType: string }>;
}

export function ChatHistory() {
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/ai/sessions')
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/ai/sessions/${sessionId}`, { method: 'DELETE' });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Chat AI Pribadi
        </h3>
        <Link
          href="/chat/ai/new"
          className="text-indigo-500 hover:text-indigo-600 text-xs font-medium"
        >
          + Baru
        </Link>
      </div>

      {isLoading ? (
        <div className="px-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-400 text-center">
          Belum ada riwayat chat AI
        </p>
      ) : (
        <ul>
          {sessions.map((session) => {
            const isActive = pathname === `/chat/ai/${session.id}`;
            const aiConfig =
              session.provider === 'gemini' ? AI_AGENTS.GEMINI : AI_AGENTS.CHATGPT;
            const lastMsg = session.messages[0];

            return (
              <li key={session.id} className="group">
                <Link
                  href={`/chat/ai/${session.id}`}
                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: aiConfig.avatarColor }}
                  >
                    {session.provider === 'gemini' ? 'G' : 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                      {session.title}
                    </p>
                    {lastMsg && (
                      <p className="text-xs text-gray-400 truncate">
                        {truncate(lastMsg.content, 35)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                    title="Hapus sesi"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
