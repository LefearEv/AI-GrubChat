// apps/web/src/components/ui/NotificationBell.tsx
'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatChatTime } from '@/lib/utils';

const NOTIFICATION_ICONS: Record<string, string> = {
  mention: '💬',
  friend_request: '🤝',
  group_invite: '👥',
};

const NOTIFICATION_LABELS: Record<string, string> = {
  mention: 'Kamu di-mention',
  friend_request: 'Permintaan pertemanan',
  group_invite: 'Undangan grup',
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAllRead();
        }}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifikasi"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-500 hover:text-indigo-600"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-2xl mb-2">🔔</p>
                  <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                        !notif.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                      }`}
                      onClick={() => !notif.isRead && markOneRead(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">
                          {NOTIFICATION_ICONS[notif.type] ?? '🔔'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {NOTIFICATION_LABELS[notif.type] ?? notif.type}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {notif.type === 'friend_request' && `dari ${notif.payload.fromUsername}`}
                            {notif.type === 'group_invite' && `ke grup "${notif.payload.groupName}" oleh ${notif.payload.invitedBy}`}
                            {notif.type === 'mention' && `di ${notif.payload.groupName}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatChatTime(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
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
