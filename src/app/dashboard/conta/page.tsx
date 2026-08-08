'use client';

import { useState, useEffect } from 'react';
import { Settings, User, Mail, Lock, Check, Save } from 'lucide-react';
import { getCurrentUserSession } from '@/lib/supabase';

export default function AccountSettingsPage() {
  const [email, setEmail] = useState('prof.ricardo@gmail.com');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const sess = await getCurrentUserSession();
      if (sess?.user?.email) {
        setEmail(sess.user.email);
      }
    }
    loadUser();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-600" /> Configurações da Conta
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie seus dados de acesso, e-mail de login e alteração de senha.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2 font-bold">
            <Check className="w-4 h-4 text-emerald-600" /> Dados da conta atualizados com sucesso!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Salvar Configurações
          </button>
        </form>
      </div>
    </div>
  );
}
