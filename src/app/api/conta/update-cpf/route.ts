import { NextResponse } from 'next/server';
import { supabaseAdmin, isRealSupabaseConfigured } from '@/lib/supabase';
import { isValidCPF } from '@/lib/asaas-service';

export async function POST(request: Request) {
  try {
    const { newCpf, creatorId } = await request.json();

    if (!newCpf || !creatorId) {
      return NextResponse.json(
        { success: false, error: 'O novo CPF e o ID do criador são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanCpf = newCpf.replace(/\D/g, '');
    if (!isValidCPF(cleanCpf)) {
      return NextResponse.json(
        { success: false, error: 'O CPF informado é inválido.' },
        { status: 400 }
      );
    }

    if (!isRealSupabaseConfigured()) {
      return NextResponse.json({ success: true, cpf: cleanCpf });
    }

    // Buscar usuário para ver se ele já alterou o CPF antes
    const { data: userResponse, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(creatorId);
    
    if (fetchError || !userResponse?.user) {
      return NextResponse.json(
        { success: false, error: 'Falha ao encontrar conta do criador.' },
        { status: 400 }
      );
    }

    const currentMetadata = userResponse.user.user_metadata || {};
    
    if (currentMetadata.cpf_changed === true) {
      return NextResponse.json(
        { success: false, error: 'O CPF já foi alterado anteriormente e não pode ser modificado novamente.' },
        { status: 403 }
      );
    }

    // Atualizar o CPF e marcar que foi alterado
    const newMetadata = {
      ...currentMetadata,
      cpf: cleanCpf,
      cpf_changed: true
    };

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(creatorId, {
      user_metadata: newMetadata
    });

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar CPF no servidor: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, cpf: cleanCpf });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Erro interno ao processar troca de CPF.' },
      { status: 500 }
    );
  }
}
