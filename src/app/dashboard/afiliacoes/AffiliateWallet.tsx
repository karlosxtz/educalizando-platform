"use client";

import { useState, useEffect } from 'react';
import { Wallet, DollarSign, ArrowRightLeft, Key, CheckCircle, AlertCircle, Clock, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AffiliateWallet() {
  const [balance, setBalance] = useState({ available: 0, withdrawn: 0, pending: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [pixKey, setPixKey] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  const [pixInput, setPixInput] = useState('');
  const [isSavingPix, setIsSavingPix] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  async function fetchWithAuth(url: string, options: any = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${session.access_token}`
      }
    });
  }

  async function loadWallet() {
    setIsLoading(true);
    setError('');
    try {
      const [walletRes, pixRes] = await Promise.all([
        fetchWithAuth('/api/affiliates/withdrawals'),
        fetchWithAuth('/api/affiliates/pix-keys')
      ]);

      if (walletRes.ok) {
        const data = await walletRes.json();
        if (data.success) {
          setBalance(data.balance);
          setHistory(data.history || []);
        }
      }

      if (pixRes.ok) {
        const data = await pixRes.json();
        if (data.success && data.pixKey) {
          setPixKey(data.pixKey);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar carteira.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSavePix() {
    if (!pixInput.trim()) return;
    setIsSavingPix(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetchWithAuth('/api/affiliates/pix-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixKey: pixInput.trim() })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setPixKey(data.pixKey);
      setPixInput('');
      setSuccessMsg('Chave PIX cadastrada com sucesso!');
    } catch (e: any) {
      setError(e.message || 'Erro ao cadastrar chave PIX.');
    } finally {
      setIsSavingPix(false);
    }
  }

  async function handleWithdraw() {
    const amount = Number(withdrawAmount.replace(',', '.'));
    if (isNaN(amount) || amount < 1) {
      setError('Valor inválido. Mínimo R$ 1,00.');
      return;
    }
    if (amount > balance.available) {
      setError('Saldo insuficiente.');
      return;
    }

    setIsWithdrawing(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const res = await fetchWithAuth('/api/affiliates/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setSuccessMsg(data.message || 'Saque solicitado com sucesso!');
      setWithdrawAmount('');
      loadWallet(); // Recarrega saldo e histórico
    } catch (e: any) {
      setError(e.message || 'Erro ao solicitar saque.');
    } finally {
      setIsWithdrawing(false);
    }
  }

  if (isLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      {/* Saldo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-brand-navy to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="flex items-center gap-3 mb-2 text-blue-100">
            <Wallet className="w-5 h-5" />
            <h3 className="font-medium">Saldo Disponível</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance.available)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500">
            <Clock className="w-5 h-5" />
            <h3 className="font-medium">Saques Pendentes</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance.pending)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500">
            <CheckCircle className="w-5 h-5" />
            <h3 className="font-medium">Total Sacado</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance.withdrawn)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chave PIX */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Chave PIX (CPF)</h3>
              <p className="text-sm text-slate-500">A chave PIX deve pertencer ao titular da conta.</p>
            </div>
          </div>

          {pixKey ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Chave Cadastrada</p>
                <p className="text-lg font-bold text-slate-900 font-mono tracking-wider">{pixKey.pixKeyMasked}</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold border border-green-200">
                <Check className="w-4 h-4" />
                VALIDADA
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sua Chave PIX (CPF)</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={pixInput}
                  onChange={(e) => setPixInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                />
              </div>
              <button
                onClick={handleSavePix}
                disabled={isSavingPix || !pixInput.trim()}
                className="w-full py-3 bg-brand-navy hover:bg-brand-navy-hover text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingPix ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Validar e Salvar Chave PIX'}
              </button>
            </div>
          )}
        </div>

        {/* Solicitar Saque */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Solicitar Saque</h3>
              <p className="text-sm text-slate-500">Transfira seu saldo disponível para sua conta.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor do Saque (R$)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-medium">R$</span>
                </div>
                <input
                  type="text"
                  placeholder="0,00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9,.]/g, ''))}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all font-medium text-lg"
                  disabled={!pixKey || isWithdrawing}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 flex justify-between">
                <span>Mínimo: R$ 1,00</span>
                <button 
                  onClick={() => setWithdrawAmount(balance.available.toFixed(2).replace('.', ','))}
                  className="text-brand-primary font-medium hover:underline"
                  disabled={!pixKey}
                >
                  Sacar valor total
                </button>
              </p>
            </div>
            
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount || !pixKey || balance.available < 1}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isWithdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Saque PIX'}
            </button>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Histórico de Saques</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">ID Saque</th>
                <th className="p-4 font-medium">Chave PIX</th>
                <th className="p-4 font-medium">Valor</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Você ainda não possui histórico de saques.
                  </td>
                </tr>
              ) : (
                history.map((w: any) => (
                  <tr key={w.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(w.requestedAt).toLocaleDateString('pt-BR')} <br/>
                      <span className="text-xs">{new Date(w.requestedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="p-4 text-sm font-mono text-slate-500">{w.id.substring(0, 13)}...</td>
                    <td className="p-4 text-sm text-slate-600">{w.pixKeyMasked}</td>
                    <td className="p-4 text-sm font-bold text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(w.amount)}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        w.status === 'COMPLETED' ? 'text-green-700 bg-green-100' :
                        w.status === 'FAILED' ? 'text-red-700 bg-red-100' :
                        'text-yellow-700 bg-yellow-100'
                      }`}>
                        {w.status}
                      </span>
                      {w.failureReason && (
                        <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={w.failureReason}>
                          {w.failureReason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
