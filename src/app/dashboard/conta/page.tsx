'use client';

import { useState, useEffect } from 'react';
import { Settings, Mail, Lock, Check, Save, ShieldCheck, Key, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { getCurrentUserSession } from '@/lib/supabase';
import { maskCPF } from '@/lib/withdrawal-service';

import { getCurrentCreatorStore } from '@/lib/store-service';

export default function AccountSettingsPage() {
  const [email, setEmail] = useState('');
  const [userCpf, setUserCpf] = useState('');
  const [storeId, setStoreId] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Alteração de CPF
  const [cpfChanged, setCpfChanged] = useState(false);
  const [isEditingCpf, setIsEditingCpf] = useState(false);
  const [newCpf, setNewCpf] = useState('');
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [cpfSuccess, setCpfSuccess] = useState<string | null>(null);
  const [cpfLoading, setCpfLoading] = useState(false);

  // PIX Key State
  const [hasPixKey, setHasPixKey] = useState(false);
  const [pixKeyMasked, setPixKeyMasked] = useState('');
  const [pixHolderName, setPixHolderName] = useState('');
  const [pixInputKey, setPixInputKey] = useState('');
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixSuccess, setPixSuccess] = useState<string | null>(null);
  const [editingPix, setEditingPix] = useState(false);

  useEffect(() => {
    async function loadData() {
      const store = await getCurrentCreatorStore();
      if (store?.id) setStoreId(store.id);

      const sess = await getCurrentUserSession();
      if (sess?.user?.email) {
        setEmail(sess.user.email);
      }
      if (typeof window !== 'undefined') {
        const rawCreatorSession = localStorage.getItem('educalizando_creator_session');
        if (rawCreatorSession) {
          try {
            const parsed = JSON.parse(rawCreatorSession);
            if (parsed.email) setEmail(parsed.email);
            if (parsed.cpf) setUserCpf(parsed.cpf);
            if (parsed.cpf_changed) setCpfChanged(true);
          } catch (e) {}
        }
      }
    }
    loadData();
  }, []);

  const handleUpdateCpf = async () => {
    setCpfError(null);
    setCpfSuccess(null);
    
    const cleanCpf = newCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setCpfError('O CPF deve ter 11 dígitos.');
      return;
    }

    setCpfLoading(true);
    try {
      const sess = await getCurrentUserSession();
      if (!sess?.user?.id) throw new Error('Sessão não encontrada.');

      const res = await fetch('/api/conta/update-cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCpf: cleanCpf, creatorId: sess.user.id })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao alterar o CPF.');
      }

      setUserCpf(data.cpf);
      setCpfChanged(true);
      setIsEditingCpf(false);
      setCpfSuccess('CPF alterado com sucesso! Nenhuma outra alteração será permitida.');
      
      // Update local storage session
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('educalizando_creator_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.cpf = data.cpf;
          parsed.cpf_changed = true;
          localStorage.setItem('educalizando_creator_session', JSON.stringify(parsed));
        }
      }
    } catch (err: any) {
      setCpfError(err.message || 'Erro ao atualizar o CPF.');
    } finally {
      setCpfLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchPixKey(storeId);
    }
  }, [storeId]);

  async function fetchPixKey(activeStoreId: string) {
    try {
      const res = await fetch(`/api/financeiro/pix-key?storeId=${activeStoreId}`);
      const data = await res.json();
      if (data.success && data.hasKey && data.pixKey) {
        setHasPixKey(true);
        setPixKeyMasked(data.pixKey.pixKeyMasked);
        setPixHolderName(data.pixKey.holderName);
      }
    } catch (e) {
      console.error('Erro ao buscar chave PIX:', e);
    }
  }

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRegisterPixKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setPixError(null);
    setPixSuccess(null);

    const cleanInput = pixInputKey.replace(/\D/g, '');
    const cleanProfile = userCpf.replace(/\D/g, '');

    if (cleanInput.length !== 11) {
      setPixError('Por favor, digite um CPF válido com 11 dígitos.');
      return;
    }

    if (cleanInput !== cleanProfile) {
      setPixError('A chave PIX CPF precisa pertencer ao mesmo CPF cadastrado na sua conta.');
      return;
    }

    setPixLoading(true);

    try {
      const res = await fetch('/api/financeiro/pix-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          creatorId: 'user-demo',
          creatorProfileCpf: cleanProfile,
          inputPixKey: cleanInput
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao validar chave PIX.');
      }

      setHasPixKey(true);
      setPixKeyMasked(data.pixKey.pixKeyMasked);
      setPixHolderName(data.pixKey.holderName);
      setPixSuccess('Chave PIX CPF validada e cadastrada com sucesso!');
      setEditingPix(false);
      setPixInputKey('');
    } catch (err: any) {
      setPixError(err.message || 'Erro ao validar titularidade da chave PIX.');
    } finally {
      setPixLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl font-sans pb-12">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brand-navy" /> Configurações da Conta
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Gerencie seus dados de acesso, CPF titular e chave PIX cadastrada para saques.
        </p>
      </div>

      {/* Seção 1: Configuração da Chave PIX (Item 9 da Especificação) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
              Minha Chave PIX para Saques
            </span>
            <h2 className="text-lg font-black text-slate-900">Dados de Recebimento PIX</h2>
          </div>
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Key className="w-5 h-5" />
          </span>
        </div>

        {pixSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2 font-bold">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pixSuccess}</span>
          </div>
        )}

        {pixError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{pixError}</span>
          </div>
        )}

        {hasPixKey && !editingPix ? (
          /* Chave Cadastrada e Validada */
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Chave Validada
                  </span>
                  <span className="text-xs text-slate-500 font-bold uppercase">Tipo: CPF</span>
                </div>
                <div className="text-xl font-mono font-black text-slate-900 tracking-wider">
                  {pixKeyMasked}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Titular: <strong className="text-slate-900">{pixHolderName}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingPix(true)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-xs self-start sm:self-auto"
              >
                Alterar Chave PIX
              </button>
            </div>
          </div>
        ) : (
          /* Formulário de Cadastro / Atualização da Chave PIX */
          <form onSubmit={handleRegisterPixKey} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Por motivos de segurança, aceitamos exclusivamente <strong>Chave PIX de tipo CPF</strong> pertencente ao mesmo CPF cadastrado na sua conta. A titularidade é validada diretamente na rede bancária via Asaas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>CPF da Sua Conta *</span>
                  {!cpfChanged && !isEditingCpf && (
                    <button type="button" onClick={() => setIsEditingCpf(true)} className="text-brand-navy hover:underline lowercase text-[10px]">
                      alterar cpf
                    </button>
                  )}
                </label>
                
                {isEditingCpf ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newCpf}
                      onChange={(e) => setNewCpf(e.target.value)}
                      placeholder="Digite o novo CPF (apenas números)"
                      className="w-full px-4 py-2.5 bg-white border border-brand-navy focus:ring-2 focus:ring-brand-teal focus:border-brand-teal rounded-xl text-slate-900 text-sm font-mono focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleUpdateCpf}
                        disabled={cpfLoading}
                        className="px-3 py-1.5 bg-brand-navy hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        {cpfLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                        Salvar Novo CPF
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingCpf(false)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                    {cpfError && <p className="text-rose-600 text-[10px] font-bold">{cpfError}</p>}
                    <p className="text-[10px] text-slate-500 font-medium">Atenção: A alteração só pode ser feita <strong className="text-rose-600">uma única vez</strong>.</p>
                  </div>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={maskCPF(userCpf)}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-sm font-mono cursor-not-allowed"
                  />
                )}
                {cpfSuccess && <p className="text-emerald-600 text-[10px] font-bold mt-1">{cpfSuccess}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Sua Chave PIX (CPF) *
                </label>
                <input
                  type="text"
                  value={pixInputKey}
                  onChange={(e) => setPixInputKey(e.target.value)}
                  placeholder="Digite seu CPF (11 dígitos)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={pixLoading || isEditingCpf}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {pixLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validando Titularidade no Asaas...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Validar e Cadastrar Chave</span>
                  </>
                )}
              </button>

              {editingPix && (
                <button
                  type="button"
                  onClick={() => setEditingPix(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Seção 2: Configurações Gerais da Conta */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2 font-bold">
            <Check className="w-4 h-4 text-emerald-600" /> Dados da conta atualizados com sucesso!
          </div>
        )}

        <form onSubmit={handleSaveAccount} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              E-mail de Acesso *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Alterar Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Nova senha de no mínimo 8 caracteres"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Salvar Configurações
          </button>
        </form>
      </div>
    </div>
  );
}
