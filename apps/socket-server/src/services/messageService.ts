// apps/socket-server/src/services/messageService.ts
import { PrismaClient } from '@prisma/client';
import type { SenderType, ChatType, MentionData } from '../lib/types';

const prisma = new PrismaClient();

interface SaveMessageInput {
  groupId?: string | null;
  senderId?: string | null;
  senderType: SenderType;
  chatType: ChatType;
  recipientId?: string | null;
  content: string;
  aiModel?: string | null;
  aiPromptRef?: string | null;
  tokenCount?: number | null;
  mentions?: MentionData[];
}

export async function saveMessage(input: SaveMessageInput) {
  const message = await prisma.message.create({
    data: {
      groupId: input.groupId ?? null,
      senderId: input.senderId ?? null,
      senderType: input.senderType,
      chatType: input.chatType,
      recipientId: input.recipientId ?? null,
      content: input.content,
      aiModel: input.aiModel ?? null,
      aiPromptRef: input.aiPromptRef ?? null,
      tokenCount: input.tokenCount ?? null,
      mentions: (input.mentions ?? []) as any,
    },
    include: {
      sender: {
        select: {
          id: true,
          publicId: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Update statistik user jika pengirim adalah user
  if (input.senderId) {
    await prisma.userStats.upsert({
      where: { userId: input.senderId },
      update: { totalMessages: { increment: 1 } },
      create: { userId: input.senderId, totalMessages: 1 },
    });
  }

  // Update statistik AI interaction jika pesan memicu AI
  if (input.aiPromptRef && input.senderId) {
    // Cari siapa yang mengirim pesan trigger
    const triggerMessage = await prisma.message.findUnique({
      where: { id: input.aiPromptRef },
      select: { senderId: true },
    });

    if (triggerMessage?.senderId) {
      await prisma.userStats.upsert({
        where: { userId: triggerMessage.senderId },
        update: { totalAiInteractions: { increment: 1 } },
        create: { userId: triggerMessage.senderId, totalAiInteractions: 1 },
      });
    }
  }

  return message;
}

export async function getRecentMessages(groupId: string, limit: number = 20) {
  const messages = await prisma.message.findMany({
    where: {
      groupId,
      isDeleted: false,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: {
        select: {
          id: true,
          publicId: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Kembalikan dalam urutan kronologis (terlama dulu)
  return messages.reverse();
}
