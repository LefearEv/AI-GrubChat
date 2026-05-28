// apps/web/src/app/(main)/chat/p2p/[friendId]/page.tsx
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { P2PChatWindow } from '@/components/chat/P2PChatWindow';

interface PageProps {
  params: { friendId: string };
}

export default async function P2PChatPage({ params }: PageProps) {
  const session = await getAuth();
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const { friendId } = params;

  // Verifikasi pertemanan
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: friendId },
        { requesterId: friendId, addresseeId: userId },
      ],
      status: 'accepted',
    },
  });

  if (!friendship) notFound();

  const friend = await prisma.user.findUnique({
    where: { id: friendId, deletedAt: null },
    select: { id: true, username: true, avatarUrl: true, publicId: true },
  });

  if (!friend) notFound();

  return (
    <P2PChatWindow
      friendId={friend.id}
      friendUsername={friend.username}
      friendAvatarUrl={friend.avatarUrl}
      currentUserId={userId}
    />
  );
}
