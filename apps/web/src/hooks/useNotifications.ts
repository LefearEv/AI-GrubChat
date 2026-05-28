// apps/web/src/hooks/useNotifications.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

interface Notification {
  id: string;
  type: string;
  payload: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { socket } = useSocket({
    onNewNotification: (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    },
  } as any);

  const loadNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const markOneRead = useCallback(async (notificationId: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return { notifications, unreadCount, markAllRead, markOneRead, loadNotifications };
}
