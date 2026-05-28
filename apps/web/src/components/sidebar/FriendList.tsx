// apps/web/src/components/sidebar/FriendList.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';

interface Friend {
  friendshipId: string;
  friend: {
    id: string;
    publicId: string;
    username: string;
    avatarUrl: string | null;
  };
}

export function FriendList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetch('/api/friends')
      .then((r) => r.json())
      .then((d) => {
        setFriends(d.friends ?? []);
        setPendingRequests(d.pendingRequests ?? []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Real-time: friend request masuk & diterima
  useSocket({
    onFriendRequestReceived: (request) => {
      setPendingRequests((prev) => {
        if (prev.some((r) => r.id === request.id)) return prev;
        return [request, ...prev];
      });
    },
    onFriendRequestAccepted: ({ friend }) => {
      if (!friend) return;
      setFriends((prev) => {
        if (prev.some((f) => f.friend.id === friend.id)) return prev;
        return [{ friendshipId: friend.friendshipId, friend }, ...prev];
      });
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResult({ success: true, message: 'Permintaan pertemanan terkirim!' });
      } else {
        setSearchResult({ success: false, message: data.error });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleRespondRequest = async (friendshipId: string, action: 'accept' | 'reject') => {
    await fetch('/api/friends', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId, action }),
    });
    setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    if (action === 'accept') {
      // Refresh friend list
      const res = await fetch('/api/friends');
      const data = await res.json();
      setFriends(data.friends ?? []);
    }
  };

  return (
    <div className="py-2">
      {/* Add Friend */}
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Tambah Teman
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchResult(null); }}
            placeholder="User ID atau username..."
            className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {isSearching ? '...' : 'Cari'}
          </button>
        </div>
        {searchResult && (
          <p className={`text-xs mt-1.5 ${searchResult.success ? 'text-green-600' : 'text-red-500'}`}>
            {searchResult.message}
          </p>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Permintaan Masuk ({pendingRequests.length})
          </h3>
          {pendingRequests.map((req) => (
            <div key={req.id} className="flex items-center gap-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
                {req.requester.username.charAt(0).toUpperCase()}
              </div>
              <p className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                {req.requester.username}
              </p>
              <button
                onClick={() => handleRespondRequest(req.id, 'accept')}
                className="text-xs px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                ✓
              </button>
              <button
                onClick={() => handleRespondRequest(req.id, 'reject')}
                className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-300"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Friend List */}
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Teman ({friends.length})
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Belum ada teman. Tambahkan dengan User ID!
          </p>
        ) : (
          <ul className="space-y-0.5">
            {friends.map(({ friendshipId, friend }) => (
              <li key={friendshipId}>
                <Link
                  href={`/chat/p2p/${friend.id}`}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                    {friend.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {friend.username}
                    </p>
                    <p className="text-xs text-gray-400">{friend.publicId}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
