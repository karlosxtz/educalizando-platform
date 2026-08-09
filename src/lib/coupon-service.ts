import { supabase } from './supabase';
import { Coupon, CouponProduct, CouponValidationResult, CouponDiscountType, CouponStatus } from './types';

function getLocalCoupons(): Coupon[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('educalizando_coupons_v1');
  if (!saved) return [];
  return JSON.parse(saved);
}

function saveLocalCoupons(coupons: Coupon[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('educalizando_coupons_v1', JSON.stringify(coupons));
  }
}

// Default initial mock coupons for testing
const INITIAL_MOCK_COUPONS: Coupon[] = [
  {
    id: 'coupon-1',
    store_id: 'store-1',
    codigo: 'BEMVINDO10',
    tipo_desconto: 'percentual',
    valor_desconto: 10,
    data_inicio: new Date().toISOString(),
    data_expiracao: null,
    limite_de_usos: 100,
    usos_atuais: 14,
    status: 'ativo',
    coupon_products: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'coupon-2',
    store_id: 'store-1',
    codigo: 'PROMO15',
    tipo_desconto: 'valor_fixo',
    valor_desconto: 15.00,
    data_inicio: new Date().toISOString(),
    data_expiracao: new Date(Date.now() + 30 * 86400000).toISOString(),
    limite_de_usos: 50,
    usos_atuais: 50,
    status: 'ativo',
    coupon_products: [],
    created_at: new Date().toISOString()
  }
];

// 1. Obter todos os cupons de uma loja
export async function getCouponsByStoreId(storeId: string): Promise<Coupon[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          coupon_products (
            id,
            coupon_id,
            product_id,
            kit_id
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Coupon[];
      }
      if (error) {
        console.warn('[getCouponsByStoreId] Erro no Supabase:', error.message);
      }
    } catch (err) {
      console.error('[getCouponsByStoreId] Exceção:', err);
    }
  }

  // Fallback LocalStorage / Initial Mock
  const local = getLocalCoupons();
  if (local.length === 0) {
    saveLocalCoupons(INITIAL_MOCK_COUPONS);
    return INITIAL_MOCK_COUPONS.filter(c => c.store_id === storeId || storeId === 'store-1');
  }
  return local.filter(c => c.store_id === storeId || storeId === 'store-1');
}

// 2. Criar novo cupom
export async function createCoupon(couponData: {
  store_id: string;
  codigo: string;
  tipo_desconto: CouponDiscountType;
  valor_desconto: number;
  data_inicio?: string;
  data_expiracao?: string | null;
  limite_de_usos?: number | null;
  productIds?: string[];
  kitIds?: string[];
}): Promise<Coupon> {
  const cleanCode = couponData.codigo.trim().toUpperCase();
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data: newCoupon, error: couponError } = await supabase
        .from('coupons')
        .insert({
          store_id: couponData.store_id,
          codigo: cleanCode,
          tipo_desconto: couponData.tipo_desconto,
          valor_desconto: couponData.valor_desconto,
          data_inicio: couponData.data_inicio || new Date().toISOString(),
          data_expiracao: couponData.data_expiracao || null,
          limite_de_usos: couponData.limite_de_usos || null,
          usos_atuais: 0,
          status: 'ativo'
        })
        .select()
        .single();

      if (couponError) throw couponError;

      // Inserir escopo de produtos/kits
      const scopeItems: { coupon_id: string; product_id?: string; kit_id?: string }[] = [];
      (couponData.productIds || []).forEach(pId => {
        scopeItems.push({ coupon_id: newCoupon.id, product_id: pId });
      });
      (couponData.kitIds || []).forEach(kId => {
        scopeItems.push({ coupon_id: newCoupon.id, kit_id: kId });
      });

      if (scopeItems.length > 0) {
        const { error: scopeError } = await supabase
          .from('coupon_products')
          .insert(scopeItems);
        if (scopeError) console.warn('[createCoupon] Erro ao inserir escopo:', scopeError.message);
      }

      return {
        ...newCoupon,
        coupon_products: scopeItems as any
      };
    } catch (err: any) {
      console.error('[createCoupon] Erro:', err.message || err);
    }
  }

  // LocalStorage Fallback
  const local = getLocalCoupons();
  const newCoupon: Coupon = {
    id: `coupon-${Date.now()}`,
    store_id: couponData.store_id,
    codigo: cleanCode,
    tipo_desconto: couponData.tipo_desconto,
    valor_desconto: couponData.valor_desconto,
    data_inicio: couponData.data_inicio || new Date().toISOString(),
    data_expiracao: couponData.data_expiracao || null,
    limite_de_usos: couponData.limite_de_usos || null,
    usos_atuais: 0,
    status: 'ativo',
    coupon_products: [
      ...(couponData.productIds || []).map(pId => ({ id: `cp-${Date.now()}`, coupon_id: `coupon-${Date.now()}`, product_id: pId })),
      ...(couponData.kitIds || []).map(kId => ({ id: `ck-${Date.now()}`, coupon_id: `coupon-${Date.now()}`, kit_id: kId }))
    ],
    created_at: new Date().toISOString()
  };

  const updated = [newCoupon, ...local];
  saveLocalCoupons(updated);
  return newCoupon;
}

// 3. Atualizar cupom existente
export async function updateCoupon(
  couponId: string,
  couponData: {
    codigo: string;
    tipo_desconto: CouponDiscountType;
    valor_desconto: number;
    data_inicio?: string;
    data_expiracao?: string | null;
    limite_de_usos?: number | null;
    status?: CouponStatus;
    productIds?: string[];
    kitIds?: string[];
  }
): Promise<void> {
  const cleanCode = couponData.codigo.trim().toUpperCase();
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          codigo: cleanCode,
          tipo_desconto: couponData.tipo_desconto,
          valor_desconto: couponData.valor_desconto,
          data_inicio: couponData.data_inicio,
          data_expiracao: couponData.data_expiracao,
          limite_de_usos: couponData.limite_de_usos,
          status: couponData.status
        })
        .eq('id', couponId);

      if (error) throw error;

      // Atualizar escopo (apaga anteriores e reinsera)
      await supabase.from('coupon_products').delete().eq('coupon_id', couponId);

      const scopeItems: { coupon_id: string; product_id?: string; kit_id?: string }[] = [];
      (couponData.productIds || []).forEach(pId => scopeItems.push({ coupon_id: couponId, product_id: pId }));
      (couponData.kitIds || []).forEach(kId => scopeItems.push({ coupon_id: couponId, kit_id: kId }));

      if (scopeItems.length > 0) {
        await supabase.from('coupon_products').insert(scopeItems);
      }

      return;
    } catch (err: any) {
      console.error('[updateCoupon] Erro:', err);
    }
  }

  // LocalStorage Fallback
  const local = getLocalCoupons();
  const updated = local.map(c => {
    if (c.id === couponId) {
      return {
        ...c,
        codigo: cleanCode,
        tipo_desconto: couponData.tipo_desconto,
        valor_desconto: couponData.valor_desconto,
        data_inicio: couponData.data_inicio || c.data_inicio,
        data_expiracao: couponData.data_expiracao,
        limite_de_usos: couponData.limite_de_usos,
        status: couponData.status || c.status,
        coupon_products: [
          ...(couponData.productIds || []).map(pId => ({ id: `cp-${Date.now()}`, coupon_id: couponId, product_id: pId })),
          ...(couponData.kitIds || []).map(kId => ({ id: `ck-${Date.now()}`, coupon_id: couponId, kit_id: kId }))
        ]
      };
    }
    return c;
  });
  saveLocalCoupons(updated);
}

// 4. Alterar Status (Ativo / Inativo)
export async function toggleCouponStatus(couponId: string, newStatus: CouponStatus): Promise<void> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      await supabase.from('coupons').update({ status: newStatus }).eq('id', couponId);
      return;
    } catch (err) {
      console.error('[toggleCouponStatus] Erro:', err);
    }
  }

  const local = getLocalCoupons();
  const updated = local.map(c => c.id === couponId ? { ...c, status: newStatus } : c);
  saveLocalCoupons(updated);
}

// 5. Excluir Cupom
export async function deleteCoupon(couponId: string): Promise<void> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      await supabase.from('coupons').delete().eq('id', couponId);
      return;
    } catch (err) {
      console.error('[deleteCoupon] Erro:', err);
    }
  }

  const local = getLocalCoupons();
  const updated = local.filter(c => c.id !== couponId);
  saveLocalCoupons(updated);
}

// 6. VALIDAÇÃO CENTRALIZADA DE CUPOM
export async function validateCouponCode(
  storeId: string,
  rawCode: string,
  targetType: 'product' | 'kit',
  targetId: string,
  currentPrice: number
): Promise<CouponValidationResult> {
  const cleanCode = rawCode.trim().toUpperCase();

  if (!cleanCode) {
    return { valid: false, message: 'Informe o código do cupom.' };
  }

  // Buscar cupons da loja
  const storeCoupons = await getCouponsByStoreId(storeId);
  const coupon = storeCoupons.find(c => c.codigo.toUpperCase() === cleanCode);

  if (!coupon) {
    return { valid: false, message: 'Cupom de desconto inválido para esta loja.' };
  }

  // 1. Verificação de Status
  if (coupon.status !== 'ativo') {
    return { valid: false, message: 'Este cupom de desconto está inativo.' };
  }

  // 2. Data de Início
  const now = new Date();
  if (coupon.data_inicio && new Date(coupon.data_inicio) > now) {
    return { valid: false, message: 'Este cupom ainda não está ativo.' };
  }

  // 3. Data de Expiração
  if (coupon.data_expiracao && new Date(coupon.data_expiracao) < now) {
    return { valid: false, message: 'Este cupom de desconto já expirou.' };
  }

  // 4. Limite de Usos
  if (coupon.limite_de_usos !== null && coupon.limite_de_usos !== undefined) {
    if (coupon.usos_atuais >= coupon.limite_de_usos) {
      return { valid: false, message: 'Este cupom atingiu o limite máximo de utilizações.' };
    }
  }

  // 5. Escopo de Aplicação (Produtos/Kits)
  const productsScope = coupon.coupon_products || [];
  if (productsScope.length > 0) {
    let isAllowed = false;
    if (targetType === 'product') {
      isAllowed = productsScope.some(p => p.product_id === targetId);
    } else if (targetType === 'kit') {
      isAllowed = productsScope.some(p => p.kit_id === targetId);
    }

    if (!isAllowed) {
      return { valid: false, message: 'Este cupom não é válido para este item específico.' };
    }
  }

  // 6. Cálculo do Valor Final
  let discountAmount = 0;
  if (coupon.tipo_desconto === 'percentual') {
    discountAmount = Number(((currentPrice * coupon.valor_desconto) / 100).toFixed(2));
  } else {
    discountAmount = Number(coupon.valor_desconto);
  }

  const finalPrice = Math.max(0.01, Number((currentPrice - discountAmount).toFixed(2)));
  const realDiscountAmount = Number((currentPrice - finalPrice).toFixed(2));

  return {
    valid: true,
    message: coupon.tipo_desconto === 'percentual' 
      ? `Cupom ${coupon.codigo} aplicado: ${coupon.valor_desconto}% OFF!` 
      : `Cupom ${coupon.codigo} aplicado: R$ ${coupon.valor_desconto.toFixed(2).replace('.', ',')} OFF!`,
    coupon,
    finalPrice,
    discountAmount: realDiscountAmount
  };
}
