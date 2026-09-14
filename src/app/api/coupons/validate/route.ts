import { NextResponse } from 'next/server';
import { validateCouponCode } from '@/lib/coupon-service';

export async function POST(request: Request) {
  try {
    const { storeId, code, targetType, targetId, currentPrice } = await request.json();
    if (!storeId || !code || !targetId || !['product', 'kit'].includes(targetType)) {
      return NextResponse.json({ valid: false, message: 'Dados do cupom incompletos.' }, { status: 400 });
    }

    const price = Number(currentPrice);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ valid: false, message: 'Valor do item inválido.' }, { status: 400 });
    }

    const result = await validateCouponCode(storeId, String(code), targetType, targetId, price);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, message: 'Não foi possível validar o cupom.' }, { status: 500 });
  }
}

