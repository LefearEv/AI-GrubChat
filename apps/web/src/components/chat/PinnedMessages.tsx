// apps/web/src/components/chat/PinnedMessages.tsx
'use client';

import { useState, useEffect } from 'react';

interface PinnedMessage {
  id: string;
  messageId: string;
  content: string;
  senderName: string;
  pinnedAt: string;
}

interface PinnedMessagesProps {
  groupId: string;
}

export function PinnedMessages({ groupId }: PinnedMessagesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pins, setPins] = useState<PinnedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPins = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/pins`);
      if (res.ok) {
        const data = await res.json();
        setPins(data.pins);
      }
    } catch (err) {
      console.error('Failed to load pins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadPins();
  }, [isOpen, groupId]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Lihat pesan yang di-pin"
      >
        📌
        <span className="text-xs font-medium">Pin</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Pesan yang Di-pin
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                </div>
              ) : pins.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-2xl mb-2">📌</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Belum ada pesan yang di-pin
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {pins.map((pin) => (
                    <li key={pin.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <p className="text-xs font-semibold text-indigo-500 mb-1">
                        {pin.senderName}
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                        {pin.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Di-pin {new Date(pin.pinnedAt).toLocaleDateString('id-ID')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
