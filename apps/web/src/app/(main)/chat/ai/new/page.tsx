// apps/web/src/app/(main)/chat/ai/new/page.tsx
// Halaman pilih AI provider sebelum mulai chat
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AI_AGENTS } from '@/lib/constants';

export default function NewAIChatPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState<string | null>(null);

  const handleSelect = async (provider: 'gemini' | 'chatgpt') => {
    setIsCreating(provider);
    try {
      const res = await fetch('/api/ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        const { session } = await res.json();
        router.push(`/chat/ai/${session.id}`);
      }
    } finally {
      setIsCreating(null);
    }
  };

  const agents = [
    {
      provider: 'gemini' as const,
      name: AI_AGENTS.GEMINI.displayName,
      model: AI_AGENTS.GEMINI.model,
      color: AI_AGENTS.GEMINI.avatarColor,
      description: 'Model multimodal Google. Unggul dalam analisis, coding, dan pemahaman konteks panjang.',
      icon: 'G',
      features: ['Konteks 1M token', 'Multimodal', 'Grounding dengan Google Search'],
    },
    {
      provider: 'chatgpt' as const,
      name: AI_AGENTS.CHATGPT.displayName,
      model: AI_AGENTS.CHATGPT.model,
      color: AI_AGENTS.CHATGPT.avatarColor,
      description: 'Model flagship OpenAI. Sangat baik untuk penulisan, reasoning, dan instruksi kompleks.',
      icon: 'C',
      features: ['Reasoning canggih', 'Penulisan kreatif', 'Analisis mendalam'],
    },
  ];

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Pilih AI Assistant
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Mulai percakapan pribadi dengan AI pilihanmu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <button
              key={agent.provider}
              onClick={() => handleSelect(agent.provider)}
              disabled={isCreating !== null}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-current transition-all text-left disabled:opacity-60"
              style={{ '--tw-border-opacity': 1, color: agent.color } as any}
            >
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-md"
                style={{ backgroundColor: agent.color }}
              >
                {isCreating === agent.provider ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  agent.icon
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {agent.name}
              </h2>
              <p className="text-xs text-gray-400 mb-3 font-mono">{agent.model}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {agent.description}
              </p>

              <ul className="space-y-1">
                {agent.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span style={{ color: agent.color }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div
                className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium"
                style={{ color: agent.color }}
              >
                Mulai →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
