// apps/web/src/app/(main)/chat/ai/[sessionId]/page.tsx
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { PrivateAIChatWindow } from '@/components/chat/PrivateAIChatWindow';

interface PageProps {
  params: { sessionId: string };
}

export default async function PrivateAIChatPage({ params }: PageProps) {
  const session = await getAuth();
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const { sessionId } = params;

  const aiSession = await prisma.aiSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!aiSession) notFound();

  return (
    <PrivateAIChatWindow
      sessionId={sessionId}
      provider={aiSession.provider as 'gemini' | 'chatgpt'}
      title={aiSession.title}
    />
  );
}
