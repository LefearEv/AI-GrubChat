// apps/socket-server/src/index.ts
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { authMiddleware } from './middleware/authMiddleware';
import { registerGroupHandlers } from './handlers/groupHandler';
import { registerChatHandlers } from './handlers/chatHandler';
import { registerAIHandlers } from './handlers/aiHandler';
import { registerP2PHandlers } from './handlers/p2pHandler';
import { registerNotificationHandlers } from './handlers/notificationHandler';
import { userSocketMap } from './handlers/p2pHandler';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// HTTP endpoint untuk emit events dari Next.js API routes
app.post('/emit', (req, res) => {
  const { event, payload } = req.body;
  if (!event) return res.status(400).json({ error: 'event required' });

  const { targetUserId, groupId } = payload ?? {};

  if (targetUserId) {
    const socketId = userSocketMap.get(targetUserId);
    if (socketId) io.to(socketId).emit(event, payload);
  } else if (groupId) {
    io.to(groupId).emit(event, payload);
  }

  res.json({ success: true });
});

io.use(authMiddleware);

io.on('connection', (socket) => {
  const user = (socket as any).user;
  console.log(`[Socket] Connected: ${user.username} (${socket.id})`);

  registerGroupHandlers(io, socket);
  registerChatHandlers(io, socket);
  registerAIHandlers(io, socket);
  registerP2PHandlers(io, socket);
  registerNotificationHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${user.username} (${socket.id})`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Socket Server] Running on port ${PORT}`);
});
