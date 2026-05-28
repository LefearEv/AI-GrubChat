// apps/web/src/components/sidebar/GroupList.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { truncate } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';

interface Group {
  id: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
  lastMessage: {
    content: string;
    senderType: string;
    sender: { username: string } | null;
  } | null;
}

interface GroupListProps {
  compact?: boolean;
}

export function GroupList({ compact = false }: GroupListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const pathname = usePathname();

  const fetchGroups = () => {
    fetch('/api/groups')
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Real-time: update saat ada grup baru atau user diundang
  useSocket({
    onGroupCreated: (group) => {
      setGroups((prev) => {
        if (prev.some((g) => g.id === group.id)) return prev;
        return [{ ...group, memberCount: 1, lastMessage: null }, ...prev];
      });
    },
    onGroupMemberAdded: ({ group }) => {
      if (!group) return;
      setGroups((prev) => {
        if (prev.some((g) => g.id === group.id)) return prev;
        return [{ ...group, lastMessage: null }, ...prev];
      });
    },
    onGroupUpdated: (group) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, ...group } : g))
      );
    },
    onGroupMemberRemoved: ({ groupId }) => {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    },
    onNewMessage: (message) => {
      if (!message.groupId) return;
      setGroups((prev) =>
        prev.map((g) =>
          g.id === message.groupId
            ? {
                ...g,
                lastMessage: {
                  content: message.content,
                  senderType: message.senderType,
                  sender: message.sender ? { username: message.sender.username } : null,
                },
              }
            : g
        )
      );
    },
  });

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim(), description: newGroupDesc.trim() }),
      });
      if (res.ok) {
        const { group } = await res.json();
        setGroups((prev) => [{ ...group, memberCount: 1, lastMessage: null }, ...prev]);
        setNewGroupName('');
        setNewGroupDesc('');
        setShowCreateModal(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {compact ? 'Grup Aktif' : 'Grup Saya'}
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-indigo-500 hover:text-indigo-600 text-xs font-medium"
        >
          + Buat
        </button>
      </div>

      {isLoading ? (
        <div className="px-4 py-2 space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-400 text-center">
          Belum ada grup.{' '}
          <button onClick={() => setShowCreateModal(true)} className="text-indigo-500 hover:underline">
            Buat sekarang
          </button>
        </p>
      ) : (
        <ul>
          {(compact ? groups.slice(0, 5) : groups).map((group) => {
            const isActive = pathname === `/chat/${group.id}`;
            const lastMsgPreview = group.lastMessage
              ? `${group.lastMessage.sender?.username ?? 'AI'}: ${truncate(group.lastMessage.content, 28)}`
              : 'Belum ada pesan';

            return (
              <li key={group.id}>
                <Link
                  href={`/chat/${group.id}`}
                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex-shrink-0">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                      {group.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{lastMsgPreview}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{group.memberCount}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Buat Grup Baru</h3>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nama grup *"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <textarea
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="Deskripsi (opsional)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreateModal(false); setNewGroupName(''); setNewGroupDesc(''); }}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Batal
              </button>
              <button
                onClick={handleCreate}
                disabled={!newGroupName.trim() || isCreating}
                className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isCreating ? 'Membuat...' : 'Buat Grup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
