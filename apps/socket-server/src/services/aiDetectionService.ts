// apps/socket-server/src/services/aiDetectionService.ts
// Mendeteksi apakah pesan mengandung mention ke AI agent
import type { AIProvider } from '../lib/types';

interface AIMentionResult {
  provider: AIProvider;
  tag: string;
}

const AI_PATTERNS: Array<{ pattern: RegExp; provider: AIProvider; tag: string }> = [
  { pattern: /@Gemini\b/i, provider: 'gemini', tag: '@Gemini' },
  { pattern: /@ChatGPT\b/i, provider: 'chatgpt', tag: '@ChatGPT' },
];

/**
 * Mendeteksi mention AI dalam pesan.
 * Jika ada lebih dari satu AI yang di-mention, prioritaskan yang pertama muncul.
 */
export function detectAIMention(content: string): AIMentionResult | null {
  let firstMatch: { index: number; result: AIMentionResult } | null = null;

  for (const { pattern, provider, tag } of AI_PATTERNS) {
    const match = pattern.exec(content);
    if (match && (firstMatch === null || match.index < firstMatch.index)) {
      firstMatch = {
        index: match.index,
        result: { provider, tag },
      };
    }
  }

  return firstMatch?.result ?? null;
}

/**
 * Ekstrak semua mention (user dan AI) dari konten pesan
 */
export function extractMentions(content: string, groupMembers: Array<{ id: string; username: string }>) {
  const mentions: Array<{ type: 'user' | 'ai'; id: string; username: string }> = [];

  // Deteksi mention AI
  for (const { pattern, provider, tag } of AI_PATTERNS) {
    if (pattern.test(content)) {
      mentions.push({ type: 'ai', id: provider, username: tag });
    }
  }

  // Deteksi mention user (@username)
  const userMentionPattern = /@(\w+)/g;
  let match;
  while ((match = userMentionPattern.exec(content)) !== null) {
    const mentionedUsername = match[1].toLowerCase();
    const member = groupMembers.find(
      (m) => m.username.toLowerCase() === mentionedUsername
    );
    if (member) {
      mentions.push({ type: 'user', id: member.id, username: member.username });
    }
  }

  return mentions;
}
