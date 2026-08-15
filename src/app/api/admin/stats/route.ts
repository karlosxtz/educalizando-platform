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
    if (payload.email !== superAdminEmail) return false;
    return true;
  } catch (e) {
    return false;
  }
}

export async function GET() {
  try {
    const isAdmin = await checkSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Obter métricas globais
    
    // 1. Total de lojas
    const { count: totalStores } = await supabaseAdmin
      .from('stores')
      .select('*', { count: 'exact', head: true });

    // 2. Total de produtos
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true });

    // 3. Total de compras / alunos
    const { count: totalPurchases } = await supabaseAdmin
      .from('purchases')
      .select('*', { count: 'exact', head: true });

    // 4. Receita (Faturamento Global e Lucro da Plataforma Educalizando)
    let totalGrossRevenue = 0;
    let totalEducalizandoRevenue = 0;

    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, platform_fee_amount, created_at')
      .eq('status', 'paid');
      
    // Agrupar dados para o Gráfico (Últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const chartDataMap: Record<string, { date: string, revenue: number, educalizandoRevenue: number, salesCount: number }> = {};
    
    // Inicializar os últimos 30 dias com 0
    for(let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      chartDataMap[dateStr] = { date: dateStr, revenue: 0, educalizandoRevenue: 0, salesCount: 0 };
    }

    if (orders) {
      orders.forEach(order => {
        const gross = Number(order.total_amount) || 0;
        const fee = Number(order.platform_fee_amount) || 0;
        
        totalGrossRevenue += gross;
        totalEducalizandoRevenue += fee;
        
        const dateStr = new Date(order.created_at).toISOString().split('T')[0];
        if (chartDataMap[dateStr]) {
          chartDataMap[dateStr].revenue += gross;
          chartDataMap[dateStr].educalizandoRevenue += fee;
          chartDataMap[dateStr].salesCount += 1;
        }
      });
    }

    const chartData = Object.values(chartDataMap);

    return NextResponse.json({
      success: true,
      stats: {
        totalStores: totalStores || 0,
        totalProducts: totalProducts || 0,
        totalPurchases: totalPurchases || 0,
        totalGrossRevenue,
        totalEducalizandoRevenue
      },
      chartData
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
