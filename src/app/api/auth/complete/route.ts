import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { attributeCreatorReferral } from '@/lib/creator-referral-service';
import { NextResponse } from 'next/server';
import { resolveAccountArea } from '@/lib/account-area';

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Entre para continuar.' }, { status: 401 });
  const metadata = user.user_metadata || {};
  if (metadata.role === 'creator') {
    const existing = await supabaseAdmin.from('stores').select('id').eq('creator_id', user.id).maybeSingle();
    if (existing.error) return NextResponse.json({ error: 'Não foi possível carregar sua loja.' }, { status: 503 });
    if (!existing.data) {
      const name = String(metadata.store_name || `Loja de ${metadata.full_name || 'Criador'}`).slice(0, 120);
      // O sufixo é estável e evita colisões entre convites/cadastros simultâneos.
      const base = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'loja';
      const created = await supabaseAdmin.from('stores').insert({ creator_id: user.id, nome_loja: name, slug: `${base}-${user.id.slice(0, 8)}`, descricao: `Loja de ${metadata.full_name || name}`, cor_primaria: '#155eef', whatsapp: metadata.whatsapp || null });
      if (created.error) {
        const confirmed = await supabaseAdmin.from('stores').select('id').eq('creator_id', user.id).maybeSingle();
        if (confirmed.error || !confirmed.data) return NextResponse.json({ error: 'Não foi possível concluir sua loja.' }, { status: 503 });
      }
    }
    if (typeof metadata.creator_referral_code === 'string' && metadata.creator_referral_code) {
      // A confirmação por e-mail adia a criação da loja e a atribuição original.
      // A atribuição é idempotente, inclusive em acessos repetidos pelo link.
      try { await attributeCreatorReferral(user.id, metadata.creator_referral_code); }
      catch { console.error('[Auth] Não foi possível concluir a atribuição da indicação.'); }
    }
  }
  const admin = Boolean(process.env.SUPERADMIN_EMAIL && user.email?.toLowerCase() === process.env.SUPERADMIN_EMAIL.toLowerCase());
  try {
    const area = await resolveAccountArea(user, supabaseAdmin);
    return NextResponse.json({ destination: admin ? '/admin' : area === 'creator' ? '/dashboard' : '/cliente/dashboard' });
  } catch {
    return NextResponse.json({ error: 'Não foi possível verificar o tipo da sua conta.' }, { status: 503 });
  }
}
