import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

// ENDPOINT DE DIAGNÓSTICO TEMPORÁRIO — acessar via: /api/debug-delete?storeId=SEU_STORE_ID
// Remove este arquivo após diagnosticar o bug.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId');
  const testDeleteId = searchParams.get('testDeleteId');

  const results: Record<string, any> = {};

  // TESTE 1: Estado atual de TODOS os produtos da loja via supabaseAdmin (ignora RLS)
  const { data: allProducts, error: allErr } = await supabaseAdmin
    .from('products')
    .select('id, titulo, status, excluido_em, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50);

  results.teste1_todos_produtos_admin = {
    total: allProducts?.length || 0,
    error: allErr?.message || null,
    produtos: allProducts?.map(p => ({
      id: p.id,
      titulo: p.titulo,
      status: p.status,
      excluido_em: p.excluido_em,
      updated_at: p.updated_at
    })) || []
  };

  // TESTE 1B: Verificar se a coluna excluido_em realmente existe
  const { data: colExists, error: colExErr } = await supabaseAdmin
    .from('products')
    .select('excluido_em')
    .limit(1);

  results.teste1b_coluna_excluido_em = {
    existe: colExErr ? false : true,
    erro_se_nao_existe: colExErr?.message || null,
    amostra: colExists?.[0] || null
  };

  // TESTE 2: Mesma query via supabase client (anon key) — AFETADA por RLS
  const { data: anonProducts, error: anonErr } = await supabase
    .from('products')
    .select('id, titulo, status, excluido_em')
    .order('created_at', { ascending: false })
    .limit(50);

  results.teste2_produtos_via_anon = {
    total: anonProducts?.length || 0,
    error: anonErr?.message || null,
    nota: 'Se total=0 e sem erro, RLS de SELECT está filtrando tudo (esperado sem sessão autenticada)'
  };

  // TESTE 3: Query com filtro .is('excluido_em', null) — testa se PostgREST entende a coluna
  const { data: filteredProducts, error: filterErr } = await supabaseAdmin
    .from('products')
    .select('id, titulo, status, excluido_em')
    .is('excluido_em', null)
    .neq('status', 'excluido')
    .order('created_at', { ascending: false })
    .limit(50);

  results.teste3_query_com_filtro = {
    total: filteredProducts?.length || 0,
    error: filterErr?.message || null,
    nota: 'Se error não é null, o PostgREST não reconhece a coluna excluido_em (precisa reload schema cache)'
  };

  // TESTE 4: Verificar policies RLS de UPDATE
  results.teste4_rls_update = {
    nota: 'supabaseAdmin usa service_role_key que IGNORA RLS. Se o update funciona via admin mas não via anon/client, o problema é RLS.'
  };

  // TESTE 5: Se um testDeleteId foi fornecido, testar o soft delete AGORA
  if (testDeleteId) {
    // Estado ANTES
    const { data: before } = await supabaseAdmin
      .from('products')
      .select('id, titulo, status, excluido_em')
      .eq('id', testDeleteId)
      .maybeSingle();

    results.teste5_antes_delete = before;

    // Executar soft delete
    const { data: updated, error: updErr } = await supabaseAdmin
      .from('products')
      .update({
        excluido_em: new Date().toISOString(),
        status: 'excluido',
        updated_at: new Date().toISOString()
      })
      .eq('id', testDeleteId)
      .select('id, titulo, status, excluido_em')
      .maybeSingle();

    results.teste5_resultado_update = {
      data: updated,
      error: updErr?.message || null,
      linhas_afetadas: updated ? 1 : 0,
      nota: updated ? 'UPDATE FUNCIONOU — excluido_em foi gravado' : 'UPDATE FALHOU — 0 linhas afetadas'
    };

    // Estado DEPOIS
    const { data: after } = await supabaseAdmin
      .from('products')
      .select('id, titulo, status, excluido_em')
      .eq('id', testDeleteId)
      .maybeSingle();

    results.teste5_depois_delete = after;

    // Verificar se o produto aparece na query filtrada
    const { data: afterFiltered } = await supabaseAdmin
      .from('products')
      .select('id, titulo, status, excluido_em')
      .is('excluido_em', null)
      .neq('status', 'excluido')
      .eq('id', testDeleteId)
      .maybeSingle();

    results.teste5_aparece_na_listagem_filtrada = {
      aparece: !!afterFiltered,
      nota: afterFiltered ? 'PROBLEMA: produto excluído AINDA aparece na listagem filtrada!' : 'OK: produto não aparece na listagem filtrada'
    };
  }

  // TESTE 6: Verificar CHECK constraint de status
  const { error: checkErr } = await supabaseAdmin
    .from('products')
    .update({ status: 'excluido' })
    .eq('id', '00000000-0000-0000-0000-000000000000') // UUID inexistente, só testa a constraint
    .select('id')
    .maybeSingle();

  results.teste6_check_constraint = {
    aceita_excluido: !checkErr || checkErr.message?.includes('0 rows'),
    error: checkErr?.message || null,
    nota: checkErr?.message?.includes('check') ? 'CHECK CONSTRAINT AINDA REJEITA excluido! Migration não foi aplicada.' : 'CHECK OK ou sem erro'
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    diagnostico: results,
    instrucoes: {
      uso_basico: 'GET /api/debug-delete',
      com_store: 'GET /api/debug-delete?storeId=SEU_UUID',
      testar_delete: 'GET /api/debug-delete?testDeleteId=UUID_DO_PRODUTO (CUIDADO: vai excluir o produto de verdade!)',
      nota: 'Este endpoint usa supabaseAdmin (service_role_key) e IGNORA RLS.'
    }
  }, { status: 200 });
}
