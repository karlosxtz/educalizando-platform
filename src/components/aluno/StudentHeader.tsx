'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { GraduationCap, LogOut, BookOpen } from 'lucide-react';
import { signOutStudent } from '@/lib/student-service';

interface StudentHeaderProps {
  studentName?: string;
  studentEmail?: string;
  studentAvatarUrl?: string;
}

export default function StudentHeader({
  studentName = 'Aluno Educalizando',
  studentEmail = 'aluno@educalizando.com',
  studentAvatarUrl
}: StudentHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOutStudent();
    router.push('/aluno/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Badge */}
        <Link href="/aluno/dashboard" className="flex items-center gap-3 group">
          <img
            src="/branding/logo-educalizando.png"
            alt="Educalizando"
            className="h-9 sm:h-10 w-auto object-contain"
            style={{ width: 'auto', height: '38px' }}
          />
          <span className="hidden sm:inline-flex text-[10px] font-bold text-brand-teal uppercase tracking-widest bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-full items-center gap-1">
            <GraduationCap className="w-3 h-3 text-brand-teal" /> Área do Aluno
          </span>
        </Link>

        {/* User Account & Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/aluno/dashboard"
            className="text-xs font-bold text-slate-600 hover:text-brand-navy transition-colors hidden sm:flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-brand-teal" />
            <span>Meus Materiais</span>
          </Link>
          <Link
            href="/aluno/brindes"
            className="text-xs font-bold text-slate-600 hover:text-brand-navy transition-colors hidden sm:flex items-center gap-1.5 bg-brand-teal/10 px-2 py-1.5 rounded-lg border border-brand-teal/20"
          >
            <span className="text-brand-teal">🎁</span>
            <span className="text-brand-teal">Brindes</span>
          </Link>
          <Link
            href="/aluno/conta"
            className="text-xs font-bold text-slate-600 hover:text-brand-navy transition-colors hidden sm:flex items-center gap-1.5"
          >
            <span>Minha Conta</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Student Profile Pill */}
          <Link href="/aluno/conta" className="flex items-center gap-2.5 group/profile cursor-pointer transition-opacity hover:opacity-80">
            {studentAvatarUrl ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shadow-xs border border-slate-200">
                <img src={studentAvatarUrl} alt={studentName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-navy text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                {studentName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden md:block text-left min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate block group-hover/profile:text-brand-teal transition-colors">{studentName}</span>
              <span className="text-[10px] text-slate-400 truncate block">{studentEmail}</span>
            </div>
          </Link>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Encerrar Sessão"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

      </div>
    </header>
  );
}
