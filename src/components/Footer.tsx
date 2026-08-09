'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-100 text-slate-700 border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              {/* Discrete amber glow behind icon in footer as requested */}
              <div className="absolute inset-0 bg-brand-amber/25 blur-md rounded-full" />
              <Image
                src="/logo-icon.png"
                alt="Educalizando Logo"
                width={38}
                height={38}
                className="relative w-9 h-9 object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-black text-brand-navy">
                Educa<span className="text-brand-teal">lizando</span>
              </span>
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Plataforma de Monetização para Criadores de Infoprodutos
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-slate-600">
            <Link href="/aluno" className="hover:text-brand-teal text-brand-navy font-extrabold transition-colors">Já é aluno? Acesse seus materiais aqui</Link>
            <Link href="/login" className="hover:text-brand-navy transition-colors">Painel do Criador</Link>
            <a href="#como-funciona" className="hover:text-brand-navy transition-colors">Como Funciona</a>
            <a href="#beneficios" className="hover:text-brand-navy transition-colors">Diferenciais</a>
            <a href="#precos" className="hover:text-brand-navy transition-colors">Preços</a>
            <a href="#faq" className="hover:text-brand-navy transition-colors">Perguntas Frequentes</a>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Educalizando Plataforma Digital — Checkout Seguro com PIX Instantâneo</span>
          </div>
          <p>© {new Date().getFullYear()} Educalizando. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
