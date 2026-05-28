// apps/web/src/app/(main)/page.tsx
// Halaman default — tampilkan welcome screen
export default function HomePage() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Selamat datang di AI GrubChat
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          Pilih grup dari sidebar untuk mulai mengobrol, atau buat grup baru dan undang teman-temanmu.
        </p>
        <p className="text-sm text-indigo-500 dark:text-indigo-400 mt-4">
          Gunakan <code className="bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">@Gemini</code> atau{' '}
          <code className="bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">@ChatGPT</code> di dalam grup untuk memanggil AI
        </p>
      </div>
    </div>
  );
}
