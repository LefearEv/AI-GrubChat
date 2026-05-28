// apps/socket-server/src/middleware/authMiddleware.ts
import { Socket } from 'socket.io';

export function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const { userId, username } = socket.handshake.auth;

  if (!userId || !username) {
    return next(new Error('Authentication required: userId and username missing'));
  }

  // Attach user data ke socket
  (socket as any).user = { id: userId, username };

  next();
}
