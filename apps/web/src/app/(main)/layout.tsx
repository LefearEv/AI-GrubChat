// apps/web/src/app/(main)/layout.tsx
import { getAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuth();
  if (!session?.user) redirect('/login');

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      <Sidebar user={session.user as any} />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
