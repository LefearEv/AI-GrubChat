// apps/web/src/components/sidebar/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { GroupList } from './GroupList';
import { FriendList } from './FriendList';
import { ChatHistory } from './ChatHistory';
import { NotificationBell } from '@/components/ui/NotificationBell';

type SidebarTab = 'chats' | 'groups' | 'friends' | 'settings';

interface SidebarProps {
  user: {
    id: string;
    username: string;
    publicId: string;
    avatarUrl?: string;
    email: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('chats');
  const pathname = usePathname();

  const tabs: Array<{ id: SidebarTab; label: string; icon: string }> = [
    { id: 'chats', label: 'Chat', icon: '💬' },
    { id: 'groups', label: 'Grup', icon: '👥' },
    { id: 'friends', label: 'Teman', icon: '🤝' },
    { id: 'settings', label: 'Setelan', icon: '⚙️' },
  ];

  return (
    <aside className="w-72 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full">
      {/* User Profile Header */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {user.username}
            </p>
            <p className="text-xs text-gray-400 truncate font-mono">{user.publicId}</p>
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 py-3">
        <Link
          href="/chat/ai/new"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <span>✨</span>
          <span>Chat dengan AI</span>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 px-1 text-xs transition-colors ${
              activeTab === tab.id
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' && (
          <div>
            <ChatHistory />
            <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
              <GroupList compact />
            </div>
          </div>
        )}
        {activeTab === 'groups' && <GroupList />}
        {activeTab === 'friends' && <FriendList />}
        {activeTab === 'settings' && (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Akun
              </h3>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
              >
                <span>👤</span> Edit Profil & Setelan
              </Link>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                User ID Publik
              </h3>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bagikan ke teman</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white flex-1">
                    {user.publicId}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(user.publicId)}
                    className="text-xs text-indigo-500 hover:text-indigo-600"
                  >
                    Salin
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 dark:text-red-400 transition-colors"
            >
              <span>🚪</span> Keluar
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
