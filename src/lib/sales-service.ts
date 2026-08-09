import { PeriodFilter, SalesDataPoint, TopProductStat, RecentOrder, Product } from './types';

// Mock dataset generator to simulate real sales metrics and PIX transactions
export async function getSalesDataByPeriod(period: PeriodFilter): Promise<SalesDataPoint[]> {
  // Simulate API delay
  await new Promise(res => setTimeout(res, 150));

  if (period === '7d') {
    return [
      { date: '2026-08-02', label: 'Dom', revenue: 147.00, salesCount: 5 },
      { date: '2026-08-03', label: 'Seg', revenue: 320.00, salesCount: 9 },
      { date: '2026-08-04', label: 'Ter', revenue: 490.50, salesCount: 14 },
      { date: '2026-08-05', label: 'Qua', revenue: 280.00, salesCount: 8 },
      { date: '2026-08-06', label: 'Qui', revenue: 650.00, salesCount: 18 },
      { date: '2026-08-07', label: 'Sex', revenue: 890.00, salesCount: 24 },
      { date: '2026-08-08', label: 'Sáb', revenue: 740.00, salesCount: 20 },
    ];
  }

  if (period === '30d') {
    return [
      { date: 'Semana 1', label: 'Semana 1', revenue: 1850.00, salesCount: 52 },
      { date: 'Semana 2', label: 'Semana 2', revenue: 2490.00, salesCount: 71 },
      { date: 'Semana 3', label: 'Semana 3', revenue: 3120.00, salesCount: 89 },
      { date: 'Semana 4', label: 'Semana 4', revenue: 3517.50, salesCount: 98 },
    ];
  }

  if (period === 'month') {
    return [
      { date: 'Dia 01-05', label: '01-05 Ago', revenue: 1237.50, salesCount: 36 },
      { date: 'Dia 06-10', label: '06-10 Ago', revenue: 2280.00, salesCount: 64 },
      { date: 'Dia 11-15', label: '11-15 Ago', revenue: 1890.00, salesCount: 51 },
      { date: 'Dia 16-20', label: '16-20 Ago', revenue: 2740.00, salesCount: 78 },
      { date: 'Dia 21-25', label: '21-25 Ago', revenue: 1950.00, salesCount: 55 },
      { date: 'Dia 26-31', label: '26-31 Ago', revenue: 2880.00, salesCount: 82 },
    ];
  }

  // year
  return [
    { date: 'Jan', label: 'Jan', revenue: 2400.00, salesCount: 68 },
    { date: 'Fev', label: 'Fev', revenue: 3100.00, salesCount: 85 },
    { date: 'Mar', label: 'Mar', revenue: 4200.00, salesCount: 112 },
    { date: 'Abr', label: 'Abr', revenue: 3800.00, salesCount: 99 },
    { date: 'Mai', label: 'Mai', revenue: 5100.00, salesCount: 140 },
    { date: 'Jun', label: 'Jun', revenue: 6300.00, salesCount: 175 },
    { date: 'Jul', label: 'Jul', revenue: 7800.00, salesCount: 210 },
    { date: 'Ago', label: 'Ago', revenue: 3517.50, salesCount: 98 },
  ];
}

export async function getTopProductsReport(products: Product[]): Promise<TopProductStat[]> {
  await new Promise(res => setTimeout(res, 100));

  if (products.length === 0) {
    return [
      {
        id: 'mock-1',
        titulo: 'Apostila BNCC Educação Infantil 2026',
        tipo: 'pdf',
        preco: 29.90,
        unidadesVendidas: 142,
        faturamentoTotal: 4245.80,
        porcentagem: 45,
        capa_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'mock-2',
        titulo: 'Kit 50 Atividades de Alfabetização Lúdica',
        tipo: 'ebook',
        preco: 39.90,
        unidadesVendidas: 98,
        faturamentoTotal: 3910.20,
        porcentagem: 32,
        capa_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'mock-3',
        titulo: 'Simulado SAEB 5º Ano Matemática & Português',
        tipo: 'simulado',
        preco: 19.90,
        unidadesVendidas: 65,
        faturamentoTotal: 1293.50,
        porcentagem: 23,
        capa_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80'
      }
    ];
  }

  // Calculate stats based on actual registered products
  const mockSales = [120, 85, 45, 30, 18, 10];
  let totalRevenue = 0;
  
  const stats = products.slice(0, 5).map((p, index) => {
    const unidades = mockSales[index] || 8;
    const faturamento = p.preco * unidades;
    totalRevenue += faturamento;
    return {
      id: p.id,
      titulo: p.titulo,
      tipo: p.tipo,
      preco: p.preco,
      unidadesVendidas: unidades,
      faturamentoTotal: faturamento,
      porcentagem: 0,
      capa_url: p.capa_url
    };
  });

  return stats.map(s => ({
    ...s,
    porcentagem: totalRevenue > 0 ? Math.round((s.faturamentoTotal / totalRevenue) * 100) : 0
  }));
}

export async function getRecentOrdersFeed(): Promise<RecentOrder[]> {
  await new Promise(res => setTimeout(res, 100));

  return [
    {
      id: 'ORD-98421',
      clienteNome: 'Mariana Souza',
      clienteEmail: 'mariana.prof@gmail.com',
      produtoTitulo: 'Apostila BNCC Educação Infantil 2026',
      tipoProduto: 'pdf',
      valorTotal: 29.90,
      statusPagamento: 'pago',
      dataCompra: 'Hoje, 14:32',
      metodoPagamento: 'PIX'
    },
    {
      id: 'ORD-98420',
      clienteNome: 'Carlos Eduardo Santos',
      clienteEmail: 'carlos.pedagogo@hotmail.com',
      produtoTitulo: 'Kit 50 Atividades de Alfabetização Lúdica',
      tipoProduto: 'ebook',
      valorTotal: 39.90,
      statusPagamento: 'pago',
      dataCompra: 'Hoje, 11:15',
      metodoPagamento: 'PIX'
    },
    {
      id: 'ORD-98419',
      clienteNome: 'Fernanda Oliveira',
      clienteEmail: 'nanda.ensino@gmail.com',
      produtoTitulo: 'Simulado SAEB 5º Ano Matemática & Português',
      tipoProduto: 'simulado',
      valorTotal: 19.90,
      statusPagamento: 'pendente_pix',
      dataCompra: 'Hoje, 09:45',
      metodoPagamento: 'PIX'
    },
    {
      id: 'ORD-98418',
      clienteNome: 'Roberto Lima',
      clienteEmail: 'roberto.escola@outlook.com',
      produtoTitulo: 'Apostila BNCC Educação Infantil 2026',
      tipoProduto: 'pdf',
      valorTotal: 29.90,
      statusPagamento: 'pago',
      dataCompra: 'Ontem, 21:04',
      metodoPagamento: 'PIX'
    },
    {
      id: 'ORD-98417',
      clienteNome: 'Patrícia Mendes',
      clienteEmail: 'patricia.m@gmail.com',
      produtoTitulo: 'Curso Planejamento de Aulas BNCC Na Prática',
      tipoProduto: 'curso',
      valorTotal: 89.90,
      statusPagamento: 'expirado',
      dataCompra: 'Ontem, 16:50',
      metodoPagamento: 'PIX'
    }
  ];
}
