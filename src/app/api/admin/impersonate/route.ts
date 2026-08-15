import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'rafinhaagathathamy@gmail.com';
    return payload.email === superAdminEmail;
  } catch (e) {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: 'ID da loja obrigatório' }, { status: 400 });
    }

    // Buscar owner_id da loja
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar o email do usuário na auth.users
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(store.owner_id);

    if (userError || !user.user?.email) {
      return NextResponse.json({ error: 'Usuário dono não encontrado ou sem email' }, { status: 404 });
    }

    // Gerar um Magic Link para esse email
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.user.email,
    });

    if (linkError) {
      return NextResponse.json({ error: 'Falha ao gerar link de acesso: ' + linkError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: linkData.properties?.action_link });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
