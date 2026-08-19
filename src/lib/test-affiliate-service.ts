import { calculateAffiliateCommission } from './affiliate-service';
import { supabaseAdmin } from './supabase';

// Helper to mock the supabaseAdmin single row response
function mockSupabaseResponse(data: any, error: any = null) {
  const mockSingle = async () => {
    if (error) throw error;
    return { data };
  };
  
  const mockEq = () => ({
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockSingle
  });

  const mockSelect = () => ({
    eq: mockEq
  });

  (supabaseAdmin as any).from = () => ({
    select: mockSelect
  });
}

async function runTest(name: string, testFn: () => Promise<void>) {
  try {
    await testFn();
    console.log(`✅ [PASS] ${name}`);
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err.message);
    process.exit(1);
  }
}

async function main() {
  console.log('Running Affiliate Service Tests (Phase 2 - Self-Referral)...\n');

  await runTest('TESTE 1 — SELF-REFERRAL', async () => {
    mockSupabaseResponse({
      id: 'aff_1',
      user_id: 'user_A',
      status: 'aprovado',
      commission_type: 'percentual',
      commission_rate: 30,
      stores: { affiliate_program_enabled: true }
    });
    
    const result = await calculateAffiliateCommission({
      affiliateId: 'aff_1', productId: 'prod-123', storeId: 'store_1', buyerId: 'user_A', baseSubtotal: 100
    });
    
    if (result.affiliateCommissionAmount !== 0) throw new Error(`Expected 0, got ${result.affiliateCommissionAmount}`);
  });

  await runTest('TESTE 2 — COMPRA DE OUTRA PESSOA', async () => {
    mockSupabaseResponse({
      id: 'aff_1',
      user_id: 'user_A',
      status: 'aprovado',
      commission_type: 'percentual',
      commission_rate: 30,
      stores: { affiliate_program_enabled: true }
    });
    
    const result = await calculateAffiliateCommission({
      affiliateId: 'aff_1', productId: 'prod-123', storeId: 'store_1', buyerId: 'user_B', baseSubtotal: 100
    });
    
    if (result.affiliateCommissionAmount !== 30) throw new Error(`Expected 30, got ${result.affiliateCommissionAmount}`);
  });

  await runTest('TESTE 3 — AFILIADO REJEITADO', async () => {
    mockSupabaseResponse({
      id: 'aff_3',
      user_id: 'user_A',
      status: 'rejeitado',
      commission_rate: 50,
      stores: { affiliate_program_enabled: true }
    });
    
    const result = await calculateAffiliateCommission({
      affiliateId: 'aff_3', productId: 'prod-123', storeId: 'store_1', buyerId: 'user_B', baseSubtotal: 100
    });
    
    if (result.affiliateCommissionAmount !== 0) throw new Error(`Expected 0`);
  });

  await runTest('TESTE 4 — AFILIADO PENDENTE', async () => {
    mockSupabaseResponse({
      id: 'aff_4',
      user_id: 'user_A',
      status: 'pendente',
      commission_rate: 50,
      stores: { affiliate_program_enabled: true }
    });
    
    const result = await calculateAffiliateCommission({
      affiliateId: 'aff_4', productId: 'prod-123', storeId: 'store_1', buyerId: 'user_B', baseSubtotal: 100
    });
    
    if (result.affiliateCommissionAmount !== 0) throw new Error(`Expected 0`);
  });

  await runTest('TESTE 5 — PROGRAMA DESATIVADO', async () => {
    mockSupabaseResponse({
      id: 'aff_5',
      user_id: 'user_A',
      status: 'aprovado',
      commission_rate: 50,
      stores: { affiliate_program_enabled: false }
    });
    
    const result = await calculateAffiliateCommission({
      affiliateId: 'aff_5', productId: 'prod-123', storeId: 'store_1', buyerId: 'user_B', baseSubtotal: 100
    });
    
    if (result.affiliateCommissionAmount !== 0) throw new Error(`Expected 0`);
  });

  await runTest('TESTE 6 — AFILIADO INEXISTENTE', async () => {
    mockSupabaseResponse(null);
    
    const result = await calculateAffiliateCommission({
      affiliateId: 'aff_fake', productId: 'prod-123', storeId: 'store_1', buyerId: 'user_B', baseSubtotal: 100
    });
    
    if (result.affiliateCommissionAmount !== 0) throw new Error(`Expected 0`);
  });

  await runTest('TESTE 7 — COMPRA NORMAL SEM AFILIADO', async () => {
    // Should not even call supabase if affiliateId is null
    const result = await calculateAffiliateCommission({
      affiliateId: null, productId: 'prod-123', storeId: 'store_1', buyerId: 'user_B', baseSubtotal: 100
    });
    
    if (result.affiliateCommissionAmount !== 0) throw new Error(`Expected 0`);
  });

  await runTest('TESTE 8 — AFILIADO + OUTRO COMPRADOR + COMISSÃO PERCENTUAL', async () => {
    mockSupabaseResponse({
      id: 'aff_8',
      user_id: 'user_A',
      status: 'aprovado',
      commission_type: 'percentual',
      commission_rate: 15,
      stores: { affiliate_program_enabled: true }
    });
    
    const result = await calculateAffiliateCommission({
      affiliateId: 'aff_8', productId: 'prod-123', storeId: 'store_1', buyerId: 'user_B', baseSubtotal: 200
    });
    
    if (result.affiliateCommissionAmount !== 30) throw new Error(`Expected 30`);
  });

  await runTest('TESTE 9 — SELF-REFERRAL + COMISSÃO FIXA', async () => {
    mockSupabaseResponse({
      id: 'aff_9',
      user_id: 'user_A',
      status: 'aprovado',
      commission_type: 'fixo',
      commission_rate: 50,
      stores: { affiliate_program_enabled: true }
    });
    
    const result = await calculateAffiliateCommission({
      affiliateId: 'aff_9', productId: 'prod-123', storeId: 'store_1', buyerId: 'user_A', baseSubtotal: 200
    });
    
    if (result.affiliateCommissionAmount !== 0) throw new Error(`Expected 0`);
  });

  await runTest('TESTE 10 — SELF-REFERRAL COM COOKIE MANIPULADO', async () => {
    mockSupabaseResponse({
      id: 'aff_10',
      user_id: 'user_A',
      status: 'aprovado',
      commission_type: 'percentual',
      commission_rate: 20,
      stores: { affiliate_program_enabled: true }
    });
    
    const result = await calculateAffiliateCommission({
      affiliateId: 'aff_10', productId: 'prod-123', storeId: 'store_1', buyerId: 'user_A', baseSubtotal: 100
    });
    
    if (result.affiliateCommissionAmount !== 0) throw new Error(`Expected 0`);
  });

  console.log('\n✅ All tests completed successfully!');
}

main();
