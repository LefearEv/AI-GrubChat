# AI GrubChat

Aplikasi Group Chat berbasis web yang mengintegrasikan AI Agent (Gemini & ChatGPT) secara real-time. Semua anggota grup memiliki konteks dan riwayat chat AI yang tersinkronisasi.

---

## Fitur Lengkap

### Chat
- **Group Chat real-time** — WebSocket via Socket.io, pesan instan antar anggota
- **P2P Chat** — Chat pribadi antar user (seperti WhatsApp DM)
- **Private AI Chat** — Sesi 1-on-1 dengan Gemini atau ChatGPT, riwayat tersimpan

### AI Integration
- **@Gemini / @ChatGPT** — Panggil AI langsung di grup dengan mention
- **Context Window** — AI membaca 20 pesan terakhir sebagai konteks percakapan
- **Streaming** — Respons AI muncul secara real-time (streaming chunks)
- **Stop streaming** — Bisa menghentikan respons AI di tengah jalan

### Kolaborasi
- **@Mention user** — Tag anggota grup dengan autocomplete dropdown
- **Pin Message** — Pin pesan penting, lihat daftar pin kapan saja
- **Typing Indicator** — Indikator real-time siapa yang sedang mengetik
- **Group Member Management** — Invite, kick, leave, lihat profil anggota

### Sosial
- **Friend System** — Tambah teman via User ID publik atau username
- **Notifikasi real-time** — Push notif untuk mention, friend request, group invite
- **Profil Publik** — Statistik gamifikasi (total pesan, AI interactions, grup)

### Autentikasi & Akun
- **Email + Password** — Register & login dengan kredensial
- **Google OAuth** — Login satu klik dengan akun Google
- **Settings** — Edit username, ganti password, ukuran font, hapus akun

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend API | Next.js API Routes |
| Real-time | Socket.io (dedicated server) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (Credentials + Google OAuth) |
| AI | Vercel AI SDK (@ai-sdk/google + @ai-sdk/openai) |
| Monorepo | Turborepo + npm workspaces |
| Deployment | Docker + docker-compose |

---

## Struktur Proyek

```
ai-grubchat/
├── apps/
│   ├── web/                          # Next.js app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/           # Login, Register
│   │   │   │   ├── (main)/           # Layout dengan sidebar
│   │   │   │   │   ├── chat/
│   │   │   │   │   │   ├── [groupId]/    # Group Chat
│   │   │   │   │   │   ├── ai/
│   │   │   │   │   │   │   ├── new/      # Pilih AI provider
│   │   │   │   │   │   │   └── [sessionId]/  # Private AI Chat
│   │   │   │   │   │   └── p2p/
│   │   │   │   │   │       └── [friendId]/   # P2P Chat
│   │   │   │   │   └── settings/
│   │   │   │   └── api/
│   │   │   │       ├── ai/
│   │   │   │       │   ├── sessions/     # CRUD AI sessions
│   │   │   │       │   └── chat/         # Streaming AI endpoint
│   │   │   │       ├── groups/           # CRUD grup + members + pins
│   │   │   │       ├── friends/          # Friend system
│   │   │   │       ├── p2p/              # P2P message history
│   │   │   │       ├── notifications/    # Notifikasi
│   │   │   │       └── users/            # Profil publik + me
│   │   │   ├── components/
│   │   │   │   ├── chat/
│   │   │   │   │   ├── ChatWindow.tsx         # Group chat utama
│   │   │   │   │   ├── PrivateAIChatWindow.tsx # Private AI chat
│   │   │   │   │   ├── P2PChatWindow.tsx       # P2P chat
│   │   │   │   │   ├── MessageBubble.tsx
│   │   │   │   │   ├── MessageInput.tsx        # Input + @mention
│   │   │   │   │   ├── MentionDropdown.tsx
│   │   │   │   │   ├── PinnedMessages.tsx
│   │   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   │   └── GroupMembersPanel.tsx   # Invite/kick members
│   │   │   │   ├── sidebar/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── ChatHistory.tsx    # AI sessions dari DB
│   │   │   │   │   ├── FriendList.tsx
│   │   │   │   │   └── GroupList.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   └── UserProfileModal.tsx
│   │   │   │   └── ui/
│   │   │   │       └── NotificationBell.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSocket.ts          # Singleton Socket.io
│   │   │   │   ├── useChat.ts            # Group chat state
│   │   │   │   ├── usePrivateAIChat.ts   # Private AI streaming
│   │   │   │   ├── useMention.ts         # @mention autocomplete
│   │   │   │   └── useNotifications.ts   # Notifikasi
│   │   │   └── lib/
│   │   │       ├── prisma.ts
│   │   │       ├── auth.ts
│   │   │       └── utils.ts
│   │   └── prisma/schema.prisma
│   │
│   └── socket-server/                # Dedicated Socket.io server
│       └── src/
│           ├── handlers/
│           │   ├── chatHandler.ts        # Group messages + pin
│           │   ├── groupHandler.ts       # Join/leave room
│           │   ├── aiHandler.ts          # @Gemini/@ChatGPT streaming
│           │   ├── p2pHandler.ts         # P2P messages
│           │   └── notificationHandler.ts
│           ├── services/
│           │   ├── geminiService.ts
│           │   ├── openaiService.ts
│           │   ├── messageService.ts
│           │   └── aiDetectionService.ts
│           └── middleware/
│               └── authMiddleware.ts
│
└── packages/
    └── shared/                       # Types & constants bersama
        └── src/
            ├── types.ts
            └── constants.ts
```

---

## Cara Menjalankan

### Development (tanpa Docker)

**1. Prerequisites**
- Node.js 20+
- PostgreSQL running lokal
- API Key: [Google Gemini](https://aistudio.google.com/) dan [OpenAI](https://platform.openai.com/)

**2. Install dependencies**
```bash
npm install
```

**3. Setup environment**
```bash
cp .env.example apps/web/.env.local
cp .env.example apps/socket-server/.env
# Edit kedua file dan isi semua nilai
```

**4. Setup database**
```bash
npm run db:migrate
```

**5. Jalankan (2 terminal)**
```bash
# Terminal 1 — Web App
cd apps/web && npm run dev

# Terminal 2 — Socket Server
cd apps/socket-server && npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

### Production (Docker)

```bash
cp .env.example .env
# Edit .env dan isi semua nilai

docker-compose up -d
```

Jalankan migrasi database:
```bash
docker-compose exec web npx prisma migrate deploy --schema=apps/web/prisma/schema.prisma
```

---

## Cara Menggunakan AI di Grup

1. Buka atau buat grup chat
2. Ketik `@` untuk memunculkan dropdown mention
3. Pilih `@Gemini` atau `@ChatGPT`, lalu ketik pertanyaan
4. Contoh: `@Gemini jelaskan perbedaan REST dan GraphQL`
5. AI membaca 20 pesan terakhir sebagai konteks → respons streaming
6. Semua anggota grup melihat respons AI secara real-time

---

## Alur AI di Grup

```
User ketik "@Gemini ..."
        ↓
Socket Server: SEND_MESSAGE
        ↓
Simpan pesan user ke DB → Broadcast ke semua anggota
        ↓
Deteksi @Gemini / @ChatGPT
        ↓
Emit AI_THINKING → semua anggota lihat "..."
        ↓
Ambil 20 pesan terakhir sebagai konteks
        ↓
Panggil Gemini/OpenAI API (streaming)
        ↓
Emit AI_RESPONSE_CHUNK per chunk → semua anggota lihat streaming
        ↓
Simpan respons lengkap ke DB + update stats
        ↓
Emit AI_RESPONSE_END
```

---

## Database Schema

8 tabel: `users`, `friendships`, `groups`, `group_members`, `messages`, `ai_sessions`, `pinned_messages`, `user_stats`, `notifications`

---

*Versi: 0.1.0 | Terakhir diperbarui: Mei 2026*
