import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autenticação ausente.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: userData } = await supabase.auth.getUser(token);
    
    if (!userData?.user) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const userId = userData.user.id;

    // Buscar transações da carteira (comissões e seus estornos) que pertencem a este usuário
    const { data: transactions, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('creator_id', userId)
      .in('type', ['AFFILIATE_COMMISSION', 'REFUND'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API Affiliates Stats] Erro ao buscar transações:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
    }

    let totalComissoes = 0;
    let totalVendas = 0;
    let pendente = 0;
    let pago = 0;

    const validTransactions = transactions || [];

    validTransactions.forEach(tx => {
      // O netAmount é o valor final líquido recebido da comissão (seja + ou -)
      if (tx.status === 'COMPLETED') {
        if (tx.type === 'REFUND') {
          totalComissoes += tx.net_amount || tx.gross_amount; // valor é negativo no banco
          pago += tx.net_amount || tx.gross_amount;
          totalVendas -= 1; // desconta a venda estornada
        } else {
          totalComissoes += tx.net_amount || tx.gross_amount;
          pago += tx.net_amount || tx.gross_amount;
          totalVendas += 1; // soma a venda
        }
      } else if (tx.status === 'PENDING') {
        // Atualmente wallet-service gera tudo como COMPLETED, mas mantemos o fallback
        pendente += tx.net_amount || tx.gross_amount;
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalComissoes,
        totalVendas,
        pendente,
        pago,
        cliques: 0, // A tabela de cliques não existe no momento
      },
      recentTransactions: validTransactions.slice(0, 10).map(t => ({
        id: t.id,
        date: t.created_at,
        productName: t.product_title || 'Produto Digital',
        orderId: t.order_id,
        amount: t.net_amount || t.gross_amount,
        status: t.status
      }))
    });

  } catch (error) {
    console.error('[API Affiliates Stats] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
