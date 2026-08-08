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

  // Real-time Store Slug preview calculation
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

      // Celebration Confetti Effect
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setSuccessData({ storeSlug: res.storeSlug });

      // Redirecionamento Automático para o Dashboard após 1.5s
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
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff5722] bg-[#ff5722]/10 border border-[#ff5722]/20 px-3.5 py-1.5 rounded-full inline-block">
            CADASTRO DE CRIADOR / PROFESSOR
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Crie sua loja no <span className="gradient-text-coral">Educalizando</span>
          </h2>
          <p className="text-base text-slate-300">
            Comece a vender suas apostilas, e-books e cursos hoje mesmo. É grátis e leva menos de 2 minutos.
          </p>
        </div>

        {/* Card Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel border-[#ff5722]/30 p-6 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {successData ? (
              /* Success State Screen */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Parabéns! Sua loja foi criada com sucesso 🎉
                  </h3>
                  <p className="text-slate-300 max-w-md mx-auto text-sm">
                    Sua conta de criador no Educalizando já está pronta para receber seus primeiros materiais didáticos.
                  </p>
                </div>

                {/* Generated Store Link Box */}
                <div className="bg-[#0b0f19] border border-white/10 p-4 rounded-xl max-w-md mx-auto text-left space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Link Oficial da Sua Loja:
                  </span>
                  <div className="text-emerald-400 font-mono text-sm font-bold flex items-center justify-between">
                    <span>educalizando.com.br/loja/{successData.storeSlug}</span>
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setSuccessData(null);
                    }}
                    className="px-6 py-3 rounded-xl font-bold bg-[#ff5722] text-white text-sm shadow-lg shadow-[#ff5722]/30 hover:bg-[#ea580c] transition-colors"
                  >
                    Cadastrar Outra Conta
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Registration Form Screen */
              <form key="form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Server Error Alert Banner */}
                {serverError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Grid Form Inputs */}
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ex: Prof. Ricardo Silva"
                        {...register('fullName')}
                        className={`w-full pl-11 pr-4 py-3 bg-[#0b0f19]/70 border ${
                          errors.fullName ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-[#ff5722]'
                        } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 transition-all`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-xs text-rose-400 mt-1 font-medium">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      E-mail Profissional *
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        {...register('email')}
                        className={`w-full pl-11 pr-4 py-3 bg-[#0b0f19]/70 border ${
                          errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-[#ff5722]'
                        } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 transition-all`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-rose-400 mt-1 font-medium">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Store / Brand Name */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Nome da Sua Loja / Marca *
                    </label>
                    <div className="relative">
                      <Store className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ex: Professor Ricardo Cursos ou Editora Didática"
                        {...register('storeName')}
                        className={`w-full pl-11 pr-4 py-3 bg-[#0b0f19]/70 border ${
                          errors.storeName ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-[#ff5722]'
                        } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 transition-all`}
                      />
                    </div>
                    {errors.storeName && (
                      <p className="text-xs text-rose-400 mt-1 font-medium">{errors.storeName.message}</p>
                    )}

                    {/* Live Store Slug Preview */}
                    <div className="bg-[#0b0f19] border border-white/5 p-3 rounded-lg flex items-center justify-between text-xs text-slate-400 mt-2">
                      <span>Preview do seu link exclusivo:</span>
                      <span className="text-[#10b981] font-mono font-bold">
                        educalizando.com.br/loja/<span className="text-white">{generatedSlug}</span>
                      </span>
                    </div>
                  </div>

                  {/* Area of Expertise Category */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Área de Atuação Principal *
                    </label>
                    <select
                      {...register('category')}
                      className="w-full px-4 py-3 bg-[#0b0f19]/70 border border-white/10 focus:border-[#ff5722] rounded-xl text-white text-sm focus:outline-none focus:ring-1 transition-all"
                    >
                      <option value="ENEM & Vestibulares">ENEM & Vestibulares</option>
                      <option value="Concursos Públicos">Concursos Públicos</option>
                      <option value="Ensino Fundamental">Ensino Fundamental</option>
                      <option value="Educação Infantil">Educação Infantil</option>
                      <option value="Ensino Superior & Pós">Ensino Superior & Pós-Graduação</option>
                      <option value="Idiomas">Idiomas (Inglês, Espanhol, etc.)</option>
                      <option value="Desenvolvimento & Outros">Desenvolvimento & Cursos Livres</option>
                    </select>
                    {errors.category && (
                      <p className="text-xs text-rose-400 mt-1 font-medium">{errors.category.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Senha Acesso *
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('password')}
                        className={`w-full pl-11 pr-11 py-3 bg-[#0b0f19]/70 border ${
                          errors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-[#ff5722]'
                        } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-400 mt-1 font-medium">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Confirmar Senha *
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('confirmPassword')}
                        className={`w-full pl-11 pr-11 py-3 bg-[#0b0f19]/70 border ${
                          errors.confirmPassword ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-[#ff5722]'
                        } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-rose-400 mt-1 font-medium">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                </div>

                {/* Terms Acceptance Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('acceptTerms')}
                      className="mt-1 rounded bg-[#0b0f19] border-white/20 text-[#ff5722] focus:ring-[#ff5722] accent-[#ff5722]"
                    />
                    <span className="text-xs text-slate-300 leading-relaxed">
                      Eu aceito os <a href="#" className="text-[#ff5722] font-semibold underline">Termos de Uso</a> e a <a href="#" className="text-[#ff5722] font-semibold underline">Política de Privacidade</a> da plataforma Educalizando.
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{errors.acceptTerms.message}</p>
                  )}
                </div>

                {/* Submit CTA Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl font-extrabold text-base bg-gradient-to-r from-[#ff5722] via-[#ea580c] to-[#f59e0b] text-white shadow-xl shadow-[#ff5722]/30 hover:shadow-[#ff5722]/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Criando sua loja no Educalizando...</span>
                      </>
                    ) : (
                      <>
                        <Store className="w-5 h-5" />
                        <span>Criar Minha Loja Grátis</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                    <span>Seus dados estão protegidos com criptografia SSL 256-bit</span>
                  </div>
                </div>

              </form>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
