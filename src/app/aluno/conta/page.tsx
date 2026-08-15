'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, Mail, Save, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Sparkles, Camera
} from 'lucide-react';
import { z } from 'zod';

import { getCurrentStudentSession, updateStudentProfile } from '@/lib/student-service';
import StudentHeader from '@/components/aluno/StudentHeader';
import FileUpload from '@/components/dashboard/FileUpload';

const profileSchema = z.object({
  fullName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
});

export default function StudentAccountSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string; avatarUrl?: string } | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudentData() {
      try {
        const session = await getCurrentStudentSession();
        if (!session) {
          router.push('/aluno/login');
          return;
        }
        setStudentSession(session);
        setFullName(session.fullName);
        setAvatarUrl(session.avatarUrl || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Validar dados
      profileSchema.parse({ fullName });
      
      setSaving(true);
      await updateStudentProfile(fullName, avatarUrl);
      
      // Update local state to reflect changes immediately
      if (studentSession) {
        setStudentSession({
          ...studentSession,
          fullName,
          avatarUrl: avatarUrl || undefined
        });
      }
      
      setSuccessMsg('Perfil atualizado com sucesso!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
      
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrorMsg(err.errors[0].message);
      } else {
        setErrorMsg(err.message || 'Erro ao atualizar o perfil. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Student Navigation Header */}
      <StudentHeader
        studentName={studentSession?.fullName}
        studentEmail={studentSession?.email}
        studentAvatarUrl={studentSession?.avatarUrl}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-navy bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-teal" /> Perfil
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Configurações da Conta
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Atualize seu nome de exibição e foto de perfil.
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSave} className="space-y-8">
            
            {/* Avatar Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                Foto de Perfil
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-slate-100 bg-slate-50 flex-shrink-0 overflow-hidden relative shadow-inner flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-slate-300">
                      {fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 w-full max-w-sm">
                  <FileUpload
                    bucket="student-avatars"
                    accept="image/png, image/jpeg, image/webp"
                    maxSizeMB={2}
                    value={avatarUrl}
                    onChange={(url) => setAvatarUrl(url)}
                    label="Fazer Upload"
                    helperText="Formato JPG, PNG ou WEBP. Máx: 2MB. Imagem circular."
                    isImage={true}
                    aspectRatio="1:1"
                  />
                </div>
              </div>
            </div>
            
            <hr className="border-slate-100" />

            {/* Personal Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Informações Pessoais
              </h3>
              
              <div className="grid gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-xs font-bold text-slate-700">Nome Completo</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="Seu nome"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    Endereço de E-mail
                    <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Apenas Leitura</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={studentSession?.email || ''}
                      readOnly
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <p className="text-sm font-semibold">{errorMsg}</p>
              </motion.div>
            )}

            {successMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                <p className="text-sm font-semibold">{successMsg}</p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving || !fullName.trim()}
                className="bg-brand-navy hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
            
          </form>
        </div>
      </main>
    </div>
  );
}
