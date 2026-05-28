// apps/web/src/app/(main)/settings/page.tsx
'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { FONT_SIZE_MAP } from '@/lib/constants';
import type { FontSize } from '@/lib/types';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const user = session?.user as any;

  const [username, setUsername] = useState(user?.username ?? '');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, fontSize }),
      });
      if (res.ok) {
        setSaveMessage('Profil berhasil disimpan!');
        await update(); // Refresh session
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'HAPUS AKUN') return;
    await fetch('/api/users/me', { method: 'DELETE' });
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan</h1>

      {/* Profil */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User ID Publik
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono text-gray-900 dark:text-white">
                {user?.publicId}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(user?.publicId ?? '')}
                className="px-3 py-2 text-sm text-indigo-500 hover:text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Salin
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Bagikan ID ini agar teman bisa menemukan kamu</p>
          </div>
        </div>
      </section>

      {/* Aksesibilitas */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aksesibilitas</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Ukuran Font Chat
          </label>
          <div className="flex gap-3">
            {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`flex-1 py-2 px-4 rounded-xl border text-sm transition-colors ${
                  fontSize === size
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                style={{ fontSize: FONT_SIZE_MAP[size] }}
              >
                {size === 'small' ? 'Kecil' : size === 'medium' ? 'Sedang' : 'Besar'}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3" style={{ fontSize: FONT_SIZE_MAP[fontSize] }}>
            Contoh teks dengan ukuran {fontSize === 'small' ? 'kecil' : fontSize === 'medium' ? 'sedang' : 'besar'}.
          </p>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
        {saveMessage && (
          <p className="text-sm text-green-600 dark:text-green-400">{saveMessage}</p>
        )}
      </div>

      {/* Danger Zone */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-900/30">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Zona Berbahaya</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Menghapus akun bersifat permanen dan tidak dapat dibatalkan.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Hapus Akun
        </button>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hapus Akun?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Semua data kamu — pesan, grup, dan riwayat chat — akan dihapus secara permanen.
                Tindakan ini <strong>tidak dapat dibatalkan</strong>.
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ketik <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">HAPUS AKUN</code> untuk konfirmasi
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="HAPUS AKUN"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'HAPUS AKUN'}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
