import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente manualmente se não carregadas automaticamente
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qntvixlkywuztzcbgpzb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykeyforlocaltesting';

// Usar o supabaseAdmin para garantir a visualização ignorando RLS no script local
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function runQueries() {
  console.log("=== EXECUTANDO QUERIES DE VERIFICAÇÃO ===");

  // Query 1: Contagem por status
  const { data: countData, error: countError } = await supabaseAdmin
    .from('affiliates')
    .select('status');
  
  if (countError) {
    console.error("Erro na contagem:", countError);
  } else {
    const counts: Record<string, number> = {};
    countData.forEach((row: any) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });
    console.log("Contagem real por status na tabela inteira:");
    console.log(counts);
  }

  // Query 2: Listar pendentes com informações
  const { data: pendentesData, error: pendentesError } = await supabaseAdmin
    .from('affiliates')
    .select(`
      id,
      status,
      store_id,
      user_id,
      stores (
        nome_loja,
        creator_id
      )
    `)
    .eq('status', 'pendente');

  if (pendentesError) {
    console.error("Erro ao listar pendentes:", pendentesError);
  } else {
    console.log("\nLista de afiliados pendentes:");
    pendentesData.forEach((row: any) => {
      console.log(`- ID: ${row.id}, Loja: ${row.stores?.nome_loja}, Creator: ${row.stores?.creator_id}, Afiliado: ${row.user_id}`);
    });
  }
}

runQueries();
