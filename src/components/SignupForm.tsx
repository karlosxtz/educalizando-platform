'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { 
  Store, User, Mail, Lock, Eye, EyeOff, CheckCircle2, 
  AlertCircle, Loader2, ArrowRight 
} from 'lucide-react';
import { creatorSignupSchema, type CreatorSignupFormValues } from '@/lib/zod-schemas';
import { registerCreatorInSupabase } from '@/lib/supabase';
import CustomSelect from '@/components/ui/CustomSelect';
import { toast } from 'sonner';

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreatorSignupFormValues>({
    resolver: zodResolver(creatorSignupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      storeName: '',
      whatsapp: '',
      category: 'Ensino Médio & ENEM',
      acceptTerms: true
    }
  });

  const watchStoreName = watch('storeName');
  const watchCategory = watch('category');

  const generatedSlug = watchStoreName
    ? watchStoreName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'minha-loja'
    : 'minha-loja';

  const onSubmit: SubmitHandler<CreatorSignupFormValues> = async (data) => {
    setServerError(null);
    try {
      const result = await registerCreatorInSupabase({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        cpf: data.cpf,
        storeName: data.storeName,
        category: data.category,
        whatsapp: data.whatsapp
      });

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

      router.push('/dashboard/loja');
      router.refresh();

    } catch (err: any) {
      let errorMessage = err.message || 'Erro ao realizar o cadastro. Verifique suas informações.';
      if (errorMessage.toLowerCase().includes('already registered')) {
        errorMessage = 'Este e-mail já está em uso.';
      }
      setServerError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <section id="cadastro" className="py-12 px-4 scroll-mt-24">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl max-w-2xl mx-auto space-y-8 relative overflow-hidden">
      
      {/* Form Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Crie Sua Conta de Criador em Segundos
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Preencha seus dados para ativar sua loja e começar a vender materiais no PIX.
        </p>
      </div>

      {serverError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Step 1: Personal Info */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy flex items-center gap-2">
              <User className="w-4 h-4 text-brand-teal" /> 1. Dados Pessoais & Login
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Nome Completo *
              </label>
              <input
                type="text"
                {...register('fullName')}
                placeholder="Ex: Prof. Ricardo Silva"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm focus:outline-none transition-all"
              />
              {errors.fullName && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Seu E-mail Principal *
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="seu.email@exemplo.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm focus:outline-none transition-all"
              />
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                CPF do Criador (para recebimentos PIX) *
              </label>
              <input
                type="text"
                {...register('cpf')}
                placeholder="000.000.000-00"
                maxLength={14}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 11) v = v.substring(0, 11);
                  v = v.replace(/(\d{3})(\d)/, '$1.$2')
                       .replace(/(\d{3})(\d)/, '$1.$2')
                       .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                  setValue('cpf', v);
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm focus:outline-none transition-all font-mono"
              />
              <p className="text-[11px] text-slate-500 font-medium">
                O CPF é utilizado obrigatoriamente para registrar sua chave PIX de transferência no Asaas.
              </p>
              {errors.cpf && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.cpf.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Store Info */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy flex items-center gap-2">
              <Store className="w-4 h-4 text-brand-teal" /> 2. Informações da Sua Loja
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Nome da Sua Loja / Marca *
              </label>
              <input
                type="text"
                {...register('storeName')}
                placeholder="Ex: Loja do Prof. Ricardo"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm focus:outline-none transition-all"
              />
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-1 truncate">
                Link: <strong className="text-brand-navy">educalizando.com.br/loja/{generatedSlug}</strong>
              </p>
              {errors.storeName && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.storeName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                WhatsApp (Suporte da Loja) *
              </label>
              <input
                type="text"
                {...register('whatsapp')}
                placeholder="(00) 00000-0000"
                maxLength={15}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 11) v = v.substring(0, 11);
                  v = v.replace(/^(\d{2})(\d)/g, '($1) $2')
                       .replace(/(\d)(\d{4})$/, '$1-$2');
                  setValue('whatsapp', v);
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm focus:outline-none transition-all font-mono"
              />
              {errors.whatsapp && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.whatsapp.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Área Principal de Atuação *
              </label>
              <CustomSelect
                options={[
                  { value: 'Ensino Médio & ENEM', label: 'Ensino Médio & ENEM' },
                  { value: 'Concursos Públicos', label: 'Concursos Públicos' },
                  { value: 'Ensino Fundamental', label: 'Ensino Fundamental' },
                  { value: 'Educação Infantil', label: 'Educação Infantil' },
                  { value: 'Ensino Superior & Pós', label: 'Ensino Superior & Pós' },
                  { value: 'Idiomas', label: 'Idiomas' },
                  { value: 'Desenvolvimento & Outros', label: 'Desenvolvimento & Outros' }
                ]}
                value={watchCategory}
                onChange={(val) => setValue('category', val as CreatorSignupFormValues['category'])}
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Password Credentials */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-teal" /> 3. Definição de Senha
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Criar Senha de Acesso *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Confirmar Senha *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Repita sua senha"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl font-extrabold text-sm bg-brand-navy hover:bg-brand-navy-hover text-white shadow-xl shadow-brand-navy/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Criando Sua Loja Grátis...</span>
            </>
          ) : (
            <span>Criar Minha Loja Grátis Agora →</span>
          )}
        </button>

      </form>
    </div>
    </section>
  );
}
