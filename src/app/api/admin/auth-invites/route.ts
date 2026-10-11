import { isSuperAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
import { NextResponse } from 'next/server';
import { z } from 'zod';
const schema = z.object({ email: z.string().email().max(254), name: z.string().trim().min(2).max(120), role: z.enum(['creator', 'student']), storeName: z.string().trim().max(120).optional() });
export async function POST(request: Request) {
  if (!await isSuperAdmin(request)) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  const limit = await consumeRequestRateLimit(request, { namespace: 'auth-invites', limit: 10, windowMs: 60_000 });
  if (!limit.allowed) return rateLimitResponse(limit);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Confira nome, e-mail e tipo de conta.' }, { status: 400 });
  const { email, name, role, storeName } = parsed.data;
  const origin = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.educalizando.com.br').replace(/\/+$/, '');
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/confirmar?next=/seguranca`,
    data: { full_name: name, role, ...(role === 'creator' ? { store_name: storeName || `Loja de ${name}`, is_creator: true } : {}) },
  });
  if (error) return NextResponse.json({ error: 'Não foi possível enviar o convite. Confira se a conta já existe e a configuração de e-mail.' }, { status: 400 });
  return NextResponse.json({ success: true });
}
