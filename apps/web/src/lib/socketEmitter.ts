// apps/web/src/lib/socketEmitter.ts
// Helper untuk emit socket events dari Next.js API routes ke socket server
// Menggunakan HTTP request ke socket server

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_INTERNAL_URL || 'http://localhost:3001';

export async function emitToSocketServer(event: string, payload: any) {
  try {
    await fetch(`${SOCKET_SERVER_URL}/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload }),
    });
  } catch (err) {
    // Non-critical — socket emit gagal tidak boleh break API response
    console.error('[SocketEmitter] Failed to emit:', event, err);
  }
}
