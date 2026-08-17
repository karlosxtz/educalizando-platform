'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, Lock, ArrowLeft, QrCode, CreditCard, FileText, 
  Check, AlertCircle, Loader2, Sparkles, Zap, Ticket, Tag, CheckCircle2,
  LogIn, UserPlus, UserCheck, Clock, CheckCircle
} from 'lucide-react';
import { Store, Product, CouponValidationResult } from '@/lib/types';
import { validateCouponCode } from '@/lib/coupon-service';
import { getAuthenticatedUserRole } from '@/lib/student-service';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/components/store/CartContext';

import { isValidCPF } from '@/lib/asaas-service';

interface CheckoutClientViewProps {
  store: Store;
  product?: Product | null;
  initialCouponCode?: string;
}

export default function CheckoutClientView({ store, product, initialCouponCode }: CheckoutClientViewProps) {
  // Scarcity timer state
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const router = useRouter();
  const { items: cartItems, total: cartTotal } = useCart();

// Student Auth Check State
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState<boolean | null>(null);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string; cpf?: string; storeName?: string } | null>(null);

  const searchParams = useSearchParams();
  const isPlrPurchase = searchParams.get('licenca') === 'plr' && product?.is_plr;

  // Computed Price State
  const [basePrice, setBasePrice] = useState<number>(() => {
    if (product) return (isPlrPurchase && product.preco_plr) ? product.preco_plr : product.preco;
    return cartTotal;
  });
  const [finalPrice, setFinalPrice] = useState<number>(basePrice);

  // Form State
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerCpf, setBuyerCpf] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix');

  // Credit Card Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Coupon State
  const [couponCode, setCouponCode] = useState(initialCouponCode || '');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  const primaryColor = store.cor_primaria || '#093b6c';

  // Verificar se o usuário está logado ao carregar o Checkout
  useEffect(() => {
    async function checkStudentAuth() {
      try {
        const session = await getAuthenticatedUserRole();
        
        const hasValidRole = isPlrPurchase ? session.role === 'creator' : session.role === 'student';
        
        if (session.isAuthenticated && hasValidRole) {
          let storeName = '';
          if (isPlrPurchase && session.userId) {
            try {
              const { data } = await supabase.from('stores').select('nome_loja').eq('creator_id', session.userId).single();
              if (data) storeName = data.nome_loja;
            } catch(e) {}
          }
          setIsStudentLoggedIn(true);
          setStudentSession({
            id: session.userId || 'student-demo',
            email: session.email || '',
            fullName: session.fullName || (isPlrPurchase ? 'Criador' : 'Aluno Educalizando'),
            cpf: session.cpf,
            storeName: storeName || undefined
          });
          if (session.fullName && session.fullName !== 'Aluno Educalizando' && session.fullName !== 'Criador') {
            setBuyerName(session.fullName);
          }
          if (session.email) setBuyerEmail(session.email);
          if (session.cpf) setBuyerCpf(session.cpf);
        } else if (session.isAuthenticated && !hasValidRole) {
          setIsStudentLoggedIn(false);
          setStudentSession(null);
          setErrorMessage(
            isPlrPurchase 
              ? 'Você está logado como ALUNO, mas apenas CRIADORES podem comprar PLR. Saia da sua conta atual e faça login como Criador.' 
              : 'Você está logado como CRIADOR, mas criadores não podem comprar materiais comuns. Saia da conta e use uma conta de ALUNO.'
          );
        } else {
          setIsStudentLoggedIn(false);
          setStudentSession(null);
        }
      } catch (err) {
        console.error(err);
        setIsStudentLoggedIn(false);
        setStudentSession(null);
      }
    }
    checkStudentAuth();
  }, []);

  // Apply Coupon Code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setErrorMessage(null);
    try {
      const res = await validateCouponCode(
        store.id,
        couponCode,
        'product',
        product ? product.id : 'cart',
        basePrice
      );
      setCouponResult(res);
      if (res.valid && res.finalPrice !== undefined) {
        setFinalPrice(res.finalPrice);
      } else {
        setFinalPrice(basePrice);
        setErrorMessage(res.message || 'Cupom inválido.');
      }
    } catch (e) {
      console.error(e);
      setFinalPrice(basePrice);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Mask Helpers
  const formatCPF = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 10) {
      return nums.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatCardNumber = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 4);
    if (nums.length >= 3) {
      return `${nums.slice(0, 2)}/${nums.slice(2)}`;
    }
    return nums;
  };

  // Submit Checkout Form
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!buyerName.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!buyerEmail.trim() || !buyerEmail.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido para receber o material.');
      return;
    }

    const cleanCpf = buyerCpf.replace(/\D/g, '');
    if (!isValidCPF(cleanCpf)) {
      setErrorMessage('O CPF informado é inválido. Por favor, verifique os dígitos digitados para a emissão do recibo.');
      return;
    }

    if (paymentMethod === 'credit_card') {
      if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        setErrorMessage('Por favor, preencha todos os dados do cartão de crédito.');
        return;
      }
    }

    if (isStudentLoggedIn === false) {
      setIsAuthError(true);
      setErrorMessage(
        isPlrPurchase 
          ? 'Para comprar Licenças PLR, é obrigatório estar conectado em uma conta de CRIADOR. Utilize o botão abaixo para fazer login.' 
          : 'Para realizar uma compra na Educalizando, é obrigatório estar conectado em uma conta de ALUNO. Utilize um dos botões abaixo para entrar ou criar sua conta.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        storeId: store.id,
        studentId: studentSession?.id,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim().toLowerCase(),
        buyerCpf: cleanCpf,
        buyerPhone,
        paymentMethod,
        isPlrPurchase,
        couponCode: couponResult?.valid ? couponCode : undefined,
        items: product ? [
          {
            productId: product.id,
            productTitle: isPlrPurchase ? `${product.titulo} (Licença PLR)` : product.titulo,
            unitPrice: finalPrice,
            storeId: store.id
          }
        ] : cartItems.map(c => ({
          productId: c.productId,
          productTitle: c.isPlr ? `${c.title} (Licença PLR)` : c.title,
          unitPrice: c.price,
          storeId: c.storeId,
          quantity: c.quantity
        }))
      };

      if (paymentMethod === 'credit_card') {
        const [expMonth, expYear] = cardExpiry.split('/');
        payload.creditCard = {
          holderName: cardName,
          number: cardNumber.replace(/\s/g, ''),
          expiryMonth: expMonth,
          expiryYear: expYear ? `20${expYear}` : '2026',
          ccv: cardCvv
        };
        payload.creditCardHolderInfo = {
          name: buyerName,
          email: buyerEmail,
          cpfCnpj: cleanCpf,
          postalCode: '01000000',
          addressNumber: '100',
          phone: buyerPhone || '11999999999'
        };
      }

      // Obter o token JWT da sessão atual do Supabase
      let token = '';
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }
      } catch (e) {}

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401 || (data.error && data.error.includes('ALUNO'))) {
          setIsAuthError(true);
        }
        throw new Error(data.error || 'Não foi possível processar o pagamento.');
      }

      // Redireciona para a tela de confirmação / QR Code do PIX
      router.push(`/loja/${store.slug}/checkout/sucesso/${data.orderId}`);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Ocorreu um erro ao processar seu pedido.');
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white"
      style={{ '--store-primary': primaryColor } as React.CSSProperties}
    >
      {/* Security Header Bar */}
      <div className="bg-slate-900 text-white py-2 px-4 text-center text-xs font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Checkout Seguro Educalizando • Ambiente Criptografado 256-bit SSL</span>
      </div>

      {/* Main Top Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {product ? (
            <Link
              href={`/loja/${store.slug}/produto/${product.id}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao produto</span>
            </Link>
          ) : (
            <Link
              href={`/loja/${store.slug}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à loja</span>
            </Link>
          )}

          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.nome_loja} className="h-8 max-w-[140px] object-contain" />
            ) : (
              <span className="font-black text-sm text-slate-900 tracking-tight">{store.nome_loja}</span>
            )}
          </div>
        </div>
      </header>

      {/* Checkout Main Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Buyer & Payment Info (8 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Comprador Info */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-7 h-7 rounded-xl bg-brand-navy text-white font-black text-xs flex items-center justify-center">
                  1
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">Seus Dados de Entrega</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    O material digital será liberado instantaneamente para este e-mail.
                  </p>
                </div>
              </div>

              {/* Status de Login ou Opções Rápidas */}
              {isStudentLoggedIn === true ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl text-xs font-bold space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <UserCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="font-extrabold text-sm text-emerald-950">
                      Conectado como {isPlrPurchase ? 'Criador' : 'Aluno'}: {studentSession?.fullName || buyerName || (isPlrPurchase ? 'Criador' : 'Aluno')} {studentSession?.storeName ? ` - ${studentSession.storeName}` : ''} ({studentSession?.email || buyerEmail})
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium pl-7">
                    Seu acesso ao material será liberado automaticamente nesta conta após a confirmação do pagamento.
                  </p>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-extrabold text-rose-950">
                      É necessário estar conectado em uma conta de {isPlrPurchase ? 'CRIADOR' : 'ALUNO'} para comprar
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium leading-relaxed">
                    Escolha abaixo uma das opções para entrar ou criar sua conta {isPlrPurchase ? 'de criador' : 'de aluno'} em poucos segundos e retornar ao pagamento:
                  </p>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <Link
                      href={isPlrPurchase 
                        ? `/dashboard/login?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '')}`
                        : `/aluno/login?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}&action=buy`}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Fazer Login de {isPlrPurchase ? 'Criador' : 'Aluno'}</span>
                    </Link>
                    <Link
                      href={isPlrPurchase 
                        ? `/dashboard/cadastro?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '')}`
                        : `/aluno/cadastro?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}&action=buy`}
                      className="px-4 py-2.5 bg-white border border-rose-300 text-rose-900 hover:bg-rose-100 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
                    >
                      <UserPlus className="w-4 h-4 text-rose-600" />
                      <span>Criar Conta de {isPlrPurchase ? 'Criador' : 'Aluno'}</span>
                    </Link>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Digite seu nome completo..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    E-mail Principal (para receber o acesso) *
                  </label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      CPF (obrigatório para nota) *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerCpf}
                      onChange={(e) => setBuyerCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      inputMode="numeric"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Celular / WhatsApp (Opcional)
                    </label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(formatPhone(e.target.value))}
                      placeholder="(00) 90000-0000"
                      maxLength={15}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Forma de Pagamento */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-7 h-7 rounded-xl bg-brand-navy text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">Forma de Pagamento</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Escolha a melhor opção para finalizar sua compra.
                  </p>
                </div>
              </div>

              {/* Payment Method Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Option 1: PIX */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    paymentMethod === 'pix' 
                      ? 'bg-emerald-50/50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <QrCode className="w-6 h-6 text-emerald-600" />
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white uppercase">
                      Instantâneo
                    </span>
                  </div>
                  <div>
                    <strong className="block text-xs font-bold">PIX</strong>
                    <span className="text-[11px] text-slate-500">Aprovação em segundos</span>
                  </div>
                </button>

                {/* Option 2: Cartão de Crédito */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'credit_card' 
                      ? 'bg-blue-50/50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold">Cartão de Crédito</strong>
                    <span className="text-[11px] text-slate-500">Até 12x no cartão</span>
                  </div>
                </button>

                {/* Option 3: Boleto Bancário */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('boleto')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'boleto' 
                      ? 'bg-purple-50/50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold">Boleto Bancário</strong>
                    <span className="text-[11px] text-slate-500">Compensação em 1 a 3 dias</span>
                  </div>
                </button>

              </div>

              {/* Conditional Credit Card Details Form */}
              {paymentMethod === 'credit_card' && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4 pt-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                      Nome impresso no Cartão *
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="NOME COMO ESTÁ NO CARTÃO"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                      Número do Cartão *
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      inputMode="numeric"
                      pattern="[0-9 ]*"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                        Validade (MM/AA) *
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/AA"
                        maxLength={5}
                        inputMode="numeric"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                        CVV (Código) *
                      </label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message Notice */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 sm:p-5 rounded-2xl text-xs font-semibold space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span className="leading-snug">{errorMessage}</span>
                  </div>

                  {(isAuthError || errorMessage.includes('ALUNO') || errorMessage.includes('CRIADOR')) && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-rose-200/80">
                      {isPlrPurchase ? (
                        <>
                          <Link
                            href={`/dashboard/login?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '')}`}
                            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <LogIn className="w-4 h-4" />
                            <span>Fazer Login de Criador</span>
                          </Link>
                          <Link
                            href={`/dashboard/cadastro?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '')}`}
                            className="px-4 py-2.5 bg-white border border-rose-300 text-rose-900 hover:bg-rose-100 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
                          >
                            <UserPlus className="w-4 h-4 text-rose-600" />
                            <span>Criar Conta de Criador</span>
                          </Link>
                        </  >
                      ) : (
                        <>
                          <Link
                            href={`/aluno/login?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}&action=buy`}
                            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <LogIn className="w-4 h-4" />
                            <span>Fazer Login de Aluno Agora</span>
                          </Link>
                          <Link
                            href={`/aluno/cadastro?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}&action=buy`}
                            className="px-4 py-2.5 bg-white border border-rose-300 text-rose-900 hover:bg-rose-100 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
                          >
                            <UserPlus className="w-4 h-4 text-rose-600" />
                            <span>Criar Conta de Aluno Grátis</span>
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-brand-navy hover:bg-brand-navy/90 text-white font-black text-sm shadow-xl shadow-brand-navy/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-brand-teal" />
                    <span>Gerando Cobrança Segura...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-brand-teal" />
                    <span>Pagar R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} com {paymentMethod.toUpperCase()}</span>
                  </>
                )}
              </button>

            </div>

          </div>

          {/* Right Column: Order Summary Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Scarcity Banner */}
            {timeLeft > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-800 shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Oferta expira em:</span>
                </div>
                <span className="text-lg font-black text-rose-600 bg-white px-3 py-1 rounded-xl shadow-xs border border-rose-100">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 sticky top-8">
              <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center justify-between">
                <span>Resumo do Pedido</span>
                <Lock className="w-4 h-4 text-emerald-500" />
              </h3>

              {/* Product Preview */}
              {product ? (
                <div className="flex items-start gap-4">
                  <img
                    src={product.capa_url || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80'}
                    alt={product.titulo}
                    className="w-16 h-20 object-cover rounded-2xl border border-slate-200 shadow-2xs flex-shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                      {product.tipo}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {isPlrPurchase ? `${product.titulo} (Licença PLR)` : product.titulo}
                    </h4>
                    <p className="text-[11px] text-slate-500">Vendido por {store.nome_loja}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80'}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs flex-shrink-0"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                            {item.type}
                          </span>
                          {item.isPlr && (
                            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase">PLR</span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-500">{item.quantity}x</span>
                          <span className="text-xs font-bold text-slate-900">
                            {(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cupom de Desconto Form */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-brand-teal" />
                  <span>Possui um cupom de desconto?</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO DO CUPOM"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
                  >
                    {validatingCoupon ? 'Validando...' : 'Aplicar'}
                  </button>
                </div>

                {couponResult?.valid && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Cupom aplicado com sucesso! ({couponResult.message})</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Preço original</span>
                  <span>R$ {basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                {couponResult?.valid && couponResult.discountAmount && (
                  <div className="flex items-center justify-between text-emerald-600 font-bold">
                    <span>Desconto do Cupom</span>
                    <span>- R$ {couponResult.discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex items-center justify-between font-black text-slate-900 text-base pt-3 border-t border-slate-200">
                  <span>Total a Pagar</span>
                  <span className="text-brand-navy">R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Guarantee Disclaimer */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Garantia de Satisfação Educalizando</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Ambiente seguro e monitorado 24/7. Após a confirmação do pagamento, seu acesso ao material será liberado imediatamente.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-3 border-t border-slate-200/60">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <CheckCircle className="w-3 h-3 text-emerald-500" /> Compra Segura
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <CheckCircle className="w-3 h-3 text-emerald-500" /> Privacidade Protegida
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex justify-center gap-4 opacity-60 grayscale pt-2">
                <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo.png" alt="Mastercard" className="h-4 object-contain" />
                <img src="https://logodownload.org/wp-content/uploads/2016/10/visa-logo.png" alt="Visa" className="h-4 object-contain" />
                <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-logo-1.png" alt="Pix" className="h-4 object-contain" />
                <img src="https://logodownload.org/wp-content/uploads/2019/09/boleto-logo.png" alt="Boleto" className="h-4 object-contain" />
              </div>

            </div>
          </div>

        </form>
      </main>
    </div>
  );
}
