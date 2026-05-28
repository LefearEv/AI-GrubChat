// apps/web/src/lib/types.ts

export type SenderType = 'user' | 'ai_gemini' | 'ai_chatgpt' | 'system';
export type ChatType = 'group' | 'private_ai' | 'p2p';
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type GroupRole = 'owner' | 'admin' | 'member';
export type FontSize = 'small' | 'medium' | 'large';
export type AIProvider = 'gemini' | 'chatgpt';
export type NotificationType = 'mention' | 'friend_request' | 'group_invite';

export interface MentionData {
  type: 'user' | 'ai';
  id: string;
  username: string;
}

export interface UserPublic {
  id: string;
  publicId: string;
  username: string;
  avatarUrl: string | null;
}

export interface MessagePayload {
  id: string;
  groupId: string | null;
  senderId: string | null;
  senderType: SenderType;
  chatType: ChatType;
  recipientId: string | null;
  content: string;
  aiModel: string | null;
  aiPromptRef: string | null;
  mentions: MentionData[];
  isDeleted: boolean;
  editedAt: string | null;
  createdAt: string;
  sender: UserPublic | null;
}

export interface TypingPayload {
  groupId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface PinPayload {
  groupId: string;
  messageId: string;
  pinnedBy: string;
}
