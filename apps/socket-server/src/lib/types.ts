export type SenderType = 'user' | 'ai_gemini' | 'ai_chatgpt' | 'system';
export type ChatType = 'group' | 'private_ai' | 'p2p';
export type AIProvider = 'gemini' | 'chatgpt';

export interface MentionData {
  type: 'user' | 'ai';
  id: string;
  username: string;
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
  createdAt: string;
}
