'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, User, Mail, Lock, Eye, EyeOff, CheckCircle2, 
  AlertCircle, Loader2, Sparkles, ExternalLink, ShieldCheck 
} from 'lucide-react';
import { creatorSignupSchema, type CreatorSignupFormValues } from '@/lib/zod-schemas';
import { registerCreatorInSupabase } from '@/lib/supabase';

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ storeSlug: string } | null>(null);

  const {
    register,
    handleSubmit,
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

  const generatedSlug = watchStoreName
    ? watchStoreName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : 'sua-loja';

  const onSubmit: SubmitHandler<CreatorSignupFormValues> = async (values) => {
    setServerError(null);
    try {
      const res = await registerCreatorInSupabase({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        storeName: values.storeName,
        category: values.category
      });

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setSuccessData({ storeSlug: res.storeSlug });

      setTimeout(() => {
        router.push('/dashboard/loja');
      }, 1500);
    } catch (err: any) {
      setServerError(err.message || 'Erro ao realizar o cadastro. Tente novamente.');
    }
  };

  return (
    <section id="cadastro" className="py-24 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full inline-block">
            CADASTRO DE CRIADOR / PROFESSOR
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Crie sua loja no <span className="gradient-text-coral">Educalizando</span>
          </h2>
          <p className="text-base text-slate-600">
            Comece a vender suas apostilas, e-books e cursos hoje mesmo. É grátis e leva menos de 2 minutos.
          </p>
        </div>

        {/* Card Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xl relative overflow-hidden"
        >
          {successData ? (
            /* Success Feedback View */
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Loja Criada com Sucesso! 🎉
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Sua loja já está ativa e seu link exclusivo foi gerado. Redirecionando para o seu painel...
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-w-md mx-auto flex items-center justify-between text-xs font-mono text-slate-700">
                <span>https://educalizando.com.br/loja/{successData.storeSlug}</span>
                <span className="text-blue-600 font-bold">Gerado</span>
              </div>
            </div>
          ) : (
            /* Main Signup Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {serverError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Grid: Name & Email */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Prof. Ricardo Silva"
                      {...register('fullName')}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                        errors.fullName ? 'border-rose-500' : 'border-slate-200 focus:border-blue-600'
                      } rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    E-mail para Acesso *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      {...register('email')}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                        errors.email ? 'border-rose-500' : 'border-slate-200 focus:border-blue-600'
                      } rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Grid: Store Name & Category */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Nome da Sua Loja / Marca *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ex: Prof. Ricardo Silva"
                      {...register('storeName')}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                        errors.storeName ? 'border-rose-500' : 'border-slate-200 focus:border-blue-600'
                      } rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                    />
                  </div>
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
                  <select
                    {...register('category')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                  >
                    <option value="Ensino Médio & ENEM">Ensino Médio & ENEM</option>
                    <option value="Concursos Públicos">Concursos Públicos</option>
                    <option value="Ensino Fundamental">Ensino Fundamental</option>
                    <option value="Educação Infantil">Educação Infantil</option>
                    <option value="Ensino Superior & Pós">Ensino Superior & Pós</option>
                    <option value="Idiomas">Idiomas</option>
                    <option value="Desenvolvimento & Outros">Desenvolvimento & Outros</option>
                  </select>
                </div>
              </div>

              {/* Grid: Password & Confirm Password */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Criar Senha de Acesso *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className={`w-full pl-10 pr-10 py-3 bg-slate-50 border ${
                        errors.password ? 'border-rose-500' : 'border-slate-200 focus:border-blue-600'
                      } rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                      className={`w-full pl-10 pr-10 py-3 bg-slate-50 border ${
                        errors.confirmPassword ? 'border-rose-500' : 'border-slate-200 focus:border-blue-600'
                      } rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Accept Terms Checkbox */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('acceptTerms')}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Li e aceito os <a href="#" className="text-blue-600 underline">Termos de Uso</a> e <a href="#" className="text-blue-600 underline">Política de Privacidade</a> do Educalizando.
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-xs text-rose-500 font-medium">{errors.acceptTerms.message}</p>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-extrabold text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Criando sua loja no Supabase...</span>
                  </>
                ) : (
                  <>
                    <Store className="w-5 h-5" />
                    <span>Criar Minha Loja Grátis Agora</span>
                  </>
                )}
              </button>

            </form>
          )}
        </motion.div>

      </div>
    </section>
  );
}
