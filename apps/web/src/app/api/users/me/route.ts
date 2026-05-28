// apps/web/src/app/api/users/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updateSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

// GET: Profil user sendiri
export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      publicId: true,
      username: true,
      email: true,
      avatarUrl: true,
      fontSize: true,
      createdAt: true,
      stats: true,
    },
  });

  return NextResponse.json({ user });
}

// PATCH: Update profil
export async function PATCH(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { username, fontSize, currentPassword, newPassword } = parsed.data;
  const updateData: Record<string, any> = {};

  if (username) {
    // Cek username tidak dipakai orang lain
    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
    });
    if (existing) return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 });
    updateData.username = username;
  }

  if (fontSize) updateData.fontSize = fontSize;

  // Ganti password
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Password lama diperlukan' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Akun ini menggunakan OAuth' }, { status: 400 });
    }
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, username: true, fontSize: true, avatarUrl: true },
  });

  return NextResponse.json({ user: updated });
}

// DELETE: Hapus akun (soft delete)
export async function DELETE(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  // Soft delete — set deletedAt
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
