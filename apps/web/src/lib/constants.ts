// apps/web/src/lib/constants.ts

export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SEND_MESSAGE: 'send_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  PIN_MESSAGE: 'pin_message',
  UNPIN_MESSAGE: 'unpin_message',

  // Server → Client
  NEW_MESSAGE: 'new_message',
  USER_TYPING: 'user_typing',
  MESSAGE_PINNED: 'message_pinned',
  MESSAGE_UNPINNED: 'message_unpinned',
  AI_THINKING: 'ai_thinking',
  AI_RESPONSE_START: 'ai_response_start',
  AI_RESPONSE_CHUNK: 'ai_response_chunk',
  AI_RESPONSE_END: 'ai_response_end',
  ERROR: 'error',
  // Real-time sidebar updates
  GROUP_CREATED: 'group_created',
  GROUP_UPDATED: 'group_updated',
  GROUP_MEMBER_ADDED: 'group_member_added',
  GROUP_MEMBER_REMOVED: 'group_member_removed',
  FRIEND_REQUEST_RECEIVED: 'friend_request_received',
  FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',
} as const;

export const AI_AGENTS = {
  GEMINI: {
    tag: '@Gemini',
    senderType: 'ai_gemini',
    model: 'gemini-2.0-flash',
    displayName: 'Gemini',
    avatarColor: '#4285F4',
  },
  CHATGPT: {
    tag: '@ChatGPT',
    senderType: 'ai_chatgpt',
    model: 'gpt-4o',
    displayName: 'ChatGPT',
    avatarColor: '#10A37F',
  },
} as const;

export const AI_CONTEXT_WINDOW = 20;

export const FONT_SIZE_MAP = {
  small: '0.875rem',
  medium: '1rem',
  large: '1.125rem',
} as const;
