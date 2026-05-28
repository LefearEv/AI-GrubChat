// apps/web/src/components/chat/TypingIndicator.tsx
'use client';

interface TypingIndicatorProps {
  users: string[]; // array of usernames
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0]} sedang mengetik...`
      : users.length === 2
      ? `${users[0]} dan ${users[1]} sedang mengetik...`
      : `${users[0]} dan ${users.length - 1} lainnya sedang mengetik...`;

  return (
    <div className="px-4 py-1.5 flex items-center gap-2">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 italic">{text}</p>
    </div>
  );
}
