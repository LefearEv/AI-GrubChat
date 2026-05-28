// apps/web/src/lib/auth.ts
import { NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { generatePublicId } from './utils';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },

  providers: [
    // Google OAuth (opsional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Email + Password
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash || user.deletedAt) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          image: user.avatarUrl,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth
      if (account?.provider === 'google' && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existing) {
          const baseName = (user.name ?? user.email.split('@')[0])
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .slice(0, 20) || 'user';

          let username = baseName;
          let counter = 1;
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${baseName}${counter++}`;
          }

          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              username,
              publicId: generatePublicId(),
              avatarUrl: user.image ?? null,
              stats: { create: {} },
            },
          });
          user.id = newUser.id;
        } else {
          user.id = existing.id;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user?.id) {
        // Ambil data lengkap dari DB saat pertama login
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            publicId: true,
            username: true,
            avatarUrl: true,
            fontSize: true,
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.publicId = dbUser.publicId;
          token.avatarUrl = dbUser.avatarUrl;
          token.fontSize = dbUser.fontSize;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).publicId = token.publicId;
        (session.user as any).avatarUrl = token.avatarUrl;
        (session.user as any).fontSize = token.fontSize;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};

// Helper untuk Server Components
export const getAuth = () => getServerSession(authOptions);
