'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { 
  Store, User, Mail, Lock, Eye, EyeOff, CheckCircle2, 
  AlertCircle, Loader2 
} from 'lucide-react';
import { creatorSignupSchema, type CreatorSignupFormValues } from '@/lib/zod-schemas';
import { registerCreatorInSupabase } from '@/lib/supabase';
import CustomSelect from '@/components/ui/CustomSelect';

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ storeSlug: string } | null>(null);

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
        storeName: data.storeName,
        category: data.category
      });

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessData({ storeSlug: result.storeSlug });

      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (err: any) {
      setServerError(err.message || 'Erro ao realizar o cadastro. Verifique suas informações.');
    }
  };

  if (successData) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl max-w-lg mx-auto text-center space-y-6"
      >
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Parabéns! Sua Loja Foi Criada com Sucesso 🎉
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            Seu cadastro foi realizado no Educalizando e sua vitrine digital já está pronta no ar!
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Link Exclusivo da Sua Loja:</span>
          <a 
            href={`/loja/${successData.storeSlug}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 font-mono text-sm font-extrabold break-all hover:underline block"
          >
            educalizando.com.br/loja/{successData.storeSlug}
          </a>
        </div>

        <div className="pt-2 text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span>Redirecionando você para o seu Painel de Criador...</span>
        </div>
      </motion.div>
    );
  }

  return (
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <User className="w-4 h-4" /> 1. Dados Pessoais & Login
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none transition-all"
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none transition-all"
              />
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Store Info */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <Store className="w-4 h-4" /> 2. Informações da Sua Loja
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Link da sua loja: <strong className="text-blue-600">educalizando.com.br/loja/{generatedSlug}</strong>
              </p>
              {errors.storeName && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.storeName.message}</p>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <Lock className="w-4 h-4" /> 3. Definição de Senha
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none pr-10"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none pr-10"
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
          className="w-full py-4 rounded-2xl font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
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
  );
}
