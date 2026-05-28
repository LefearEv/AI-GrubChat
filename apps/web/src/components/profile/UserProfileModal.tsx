// apps/web/src/components/profile/UserProfileModal.tsx
'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  publicId: string;
  username: string;
  avatarUrl: string | null;
  joinedAt: string;
  stats: {
    totalAiInteractions: number;
    totalMessages: number;
    totalPublicGroups: number;
  };
  publicGroups: Array<{ id: string; name: string; avatarUrl: string | null }>;
}

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then(setProfile)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 pt-8 pb-12 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : profile ? (
          <>
            {/* Avatar */}
            <div className="flex justify-center -mt-10 mb-4">
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 border-4 border-white dark:border-gray-800 flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-400 shadow-lg">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="px-6 pb-6">
              {/* User Info */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profile.username}
                </h2>
                <p className="text-sm text-gray-400 font-mono mt-1">{profile.publicId}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Bergabung {new Date(profile.joinedAt).toLocaleDateString('id-ID', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Stats — Gamifikasi */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Pesan', value: profile.stats.totalMessages, icon: '💬' },
                  { label: 'AI Chat', value: profile.stats.totalAiInteractions, icon: '🤖' },
                  { label: 'Grup', value: profile.stats.totalPublicGroups, icon: '👥' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center"
                  >
                    <p className="text-lg">{stat.icon}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Public Groups */}
              {profile.publicGroups.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Grup Publik
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.publicGroups.slice(0, 5).map((group) => (
                      <span
                        key={group.id}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium"
                      >
                        {group.name}
                      </span>
                    ))}
                    {profile.publicGroups.length > 5 && (
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full text-xs">
                        +{profile.publicGroups.length - 5} lainnya
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-gray-400">
            User tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
