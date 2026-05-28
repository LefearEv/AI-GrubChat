// apps/web/src/app/(main)/chat/[groupId]/page.tsx
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { ChatWindow } from '@/components/chat/ChatWindow';

interface PageProps {
  params: { groupId: string };
}

export default async function GroupChatPage({ params }: PageProps) {
  const session = await getAuth();
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const { groupId } = params;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    include: {
      group: { select: { id: true, name: true } },
    },
  });

  if (!membership) notFound();

  return (
    <div className="h-full">
      <ChatWindow
        groupId={groupId}
        groupName={membership.group.name}
        currentUserId={userId}
        currentUserRole={membership.role}
      />
    </div>
  );
}
