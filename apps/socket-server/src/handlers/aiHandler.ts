// apps/socket-server/src/handlers/aiHandler.ts
// Inti dari integrasi AI — menangani @Gemini dan @ChatGPT di dalam grup
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, AI_CONTEXT_WINDOW } from '../lib/constants';
import { getGeminiResponse } from '../services/geminiService';
import { getOpenAIResponse } from '../services/openaiService';
import { saveMessage, getRecentMessages } from '../services/messageService';
import type { AIProvider } from '../lib/types';

interface TriggerAIPayload {
  groupId: string;
  triggerMessageId: string;
  aiProvider: AIProvider;
  content: string;
}

export function registerAIHandlers(io: Server, socket: Socket) {
  // Event internal yang di-trigger oleh chatHandler
  socket.on('__trigger_ai__', async (payload: TriggerAIPayload) => {
    const { groupId, triggerMessageId, aiProvider, content } = payload;

    try {
      // 1. Beritahu semua user bahwa AI sedang "berpikir"
      io.to(groupId).emit(SOCKET_EVENTS.AI_THINKING, {
        groupId,
        provider: aiProvider,
      });

      // 2. Ambil riwayat chat terakhir sebagai konteks untuk AI
      const recentMessages = await getRecentMessages(groupId, AI_CONTEXT_WINDOW);

      // 3. Format konteks untuk dikirim ke AI
      const contextMessages = recentMessages.map((msg) => ({
        role: msg.senderType === 'user' ? 'user' : 'assistant',
        content: msg.senderType === 'user'
          ? `${msg.sender?.username || 'User'}: ${msg.content}`
          : `${msg.senderType === 'ai_gemini' ? 'Gemini' : 'ChatGPT'}: ${msg.content}`,
      }));

      // 4. Buat placeholder message ID untuk streaming
      const aiMessageId = crypto.randomUUID();

      // 5. Beritahu client bahwa streaming dimulai
      io.to(groupId).emit(SOCKET_EVENTS.AI_RESPONSE_START, {
        groupId,
        messageId: aiMessageId,
        provider: aiProvider,
      });

      // 6. Panggil AI yang sesuai dengan streaming
      let fullResponse = '';

      const onChunk = (chunk: string) => {
        fullResponse += chunk;
        io.to(groupId).emit(SOCKET_EVENTS.AI_RESPONSE_CHUNK, {
          groupId,
          messageId: aiMessageId,
          chunk,
        });
      };

      if (aiProvider === 'gemini') {
        await getGeminiResponse(contextMessages, content, onChunk);
      } else {
        await getOpenAIResponse(contextMessages, content, onChunk);
      }

      // 7. Simpan respons AI ke database
      const senderType = aiProvider === 'gemini' ? 'ai_gemini' : 'ai_chatgpt';
      const aiModel = aiProvider === 'gemini' ? 'gemini-1.5-pro' : 'gpt-4o';

      const savedMessage = await saveMessage({
        groupId,
        senderId: null,
        senderType,
        chatType: 'group',
        content: fullResponse,
        aiModel,
        aiPromptRef: triggerMessageId,
        mentions: [],
      });

      // 8. Beritahu client bahwa streaming selesai, kirim pesan final
      io.to(groupId).emit(SOCKET_EVENTS.AI_RESPONSE_END, {
        groupId,
        messageId: aiMessageId,
        savedMessageId: savedMessage.id,
        provider: aiProvider,
        fullContent: fullResponse,
      });

    } catch (err) {
      console.error(`[AI Handler] Error from ${aiProvider}:`, err);
      io.to(groupId).emit(SOCKET_EVENTS.ERROR, {
        message: `AI (${aiProvider}) gagal merespons. Coba lagi.`,
      });
    }
  });
}
