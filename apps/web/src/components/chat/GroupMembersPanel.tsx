// apps/web/src/components/chat/GroupMembersPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { UserProfileModal } from '@/components/profile/UserProfileModal';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    publicId: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface GroupMembersPanelProps {
  groupId: string;
  currentUserId: string;
  currentUserRole: string;
  onClose: () => void;
}

export function GroupMembersPanel({
  groupId,
  currentUserId,
  currentUserRole,
  onClose,
}: GroupMembersPanelProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteStatus, setInviteStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  useEffect(() => {
    fetch(`/api/groups/${groupId}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .finally(() => setIsLoading(false));
  }, [groupId]);

  const handleInvite = async () => {
    if (!inviteQuery.trim()) return;
    setIsInviting(true);
    setInviteStatus(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inviteQuery.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMembers((prev) => [...prev, data.member]);
        setInviteQuery('');
        setInviteStatus({ ok: true, msg: 'Berhasil mengundang anggota!' });
      } else {
        setInviteStatus({ ok: false, msg: data.error });
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleKick = async (targetUserId: string, username: string) => {
    if (!confirm(`Keluarkan ${username} dari grup?`)) return;
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.user.id !== targetUserId));
    }
  };

  const handleLeave = async () => {
    if (!confirm('Keluar dari grup ini?')) return;
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      window.location.href = '/';
    }
  };

  const ROLE_BADGE: Record<string, string> = {
    owner: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    member: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Anggota ({members.length})
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        {/* Invite (hanya admin/owner) */}
        {canManage && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Undang Anggota
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteQuery}
                onChange={(e) => { setInviteQuery(e.target.value); setInviteStatus(null); }}
                placeholder="User ID atau username..."
                className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
              <button
                onClick={handleInvite}
                disabled={isInviting || !inviteQuery.trim()}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {isInviting ? '...' : 'Undang'}
              </button>
            </div>
            {inviteStatus && (
              <p className={`text-xs mt-1.5 ${inviteStatus.ok ? 'text-green-600' : 'text-red-500'}`}>
                {inviteStatus.msg}
              </p>
            )}
          </div>
        )}

        {/* Member List */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="px-4 space-y-2 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <ul>
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 group"
                >
                  <button
                    onClick={() => setSelectedUserId(member.user.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
                      {member.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.user.username}
                        {member.user.id === currentUserId && (
                          <span className="text-xs text-gray-400 ml-1">(kamu)</span>
                        )}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[member.role]}`}>
                        {member.role}
                      </span>
                    </div>
                  </button>

                  {/* Kick button */}
                  {canManage &&
                    member.user.id !== currentUserId &&
                    member.role !== 'owner' && (
                      <button
                        onClick={() => handleKick(member.user.id, member.user.username)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                        title="Keluarkan dari grup"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                        </svg>
                      </button>
                    )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Leave Group */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar dari Grup
          </button>
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
}
