'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, GraduationCap, LogOut, BookOpen, User } from 'lucide-react';
import { signOutStudent } from '@/lib/student-service';

interface StudentHeaderProps {
  studentName?: string;
  studentEmail?: string;
}

export default function StudentHeader({
  studentName = 'Aluno Educalizando',
  studentEmail = 'aluno@educalizando.com'
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              Educa<span className="text-blue-600">lizando</span>
            </span>
            <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest -mt-1 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" /> Área do Aluno
            </span>
          </div>
        </Link>

        {/* User Account & Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/aluno/dashboard"
            className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors hidden sm:flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Meus Materiais</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Student Profile Pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs border border-blue-200">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate block">{studentName}</span>
              <span className="text-[10px] text-slate-400 truncate block">{studentEmail}</span>
            </div>
          </div>

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
