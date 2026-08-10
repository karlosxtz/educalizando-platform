'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X, Store, LogIn, GraduationCap } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 shadow-xs'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center cursor-pointer group shrink-0"
        >
          <img
            src="/branding/logo-educalizando.png"
            alt="Educalizando"
            className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            style={{ width: 'auto', height: '42px' }}
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <button
            onClick={() => scrollToSection('como-funciona')}
            className="hover:text-brand-navy transition-colors"
          >
            Como Funciona
          </button>
          <button
            onClick={() => scrollToSection('para-quem')}
            className="hover:text-brand-navy transition-colors"
          >
            Para Quem É
          </button>
          <button
            onClick={() => scrollToSection('beneficios')}
            className="hover:text-brand-navy transition-colors"
          >
            Diferenciais
          </button>
          <button
            onClick={() => scrollToSection('precos')}
            className="hover:text-brand-navy transition-colors"
          >
            Preços
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="hover:text-brand-navy transition-colors"
          >
            FAQ
          </button>
        </nav>

        {/* CTA Buttons Header */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/aluno/login"
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-brand-navy border border-slate-200 transition-all flex items-center gap-1.5"
          >
            <GraduationCap className="w-4 h-4 text-brand-teal" />
            <span>Área do Aluno</span>
          </Link>

          <Link
            href="/login"
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center gap-1.5"
          >
            <LogIn className="w-4 h-4 text-slate-600" />
            <span>Criador</span>
          </Link>

          <button
            onClick={() => scrollToSection('cadastro')}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-navy hover:bg-brand-navy-hover text-white shadow-md shadow-brand-navy/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5"
          >
            <Store className="w-4 h-4" />
            <span>Criar minha loja</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-blue-600 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 pt-4 pb-6 space-y-3 shadow-lg">
          <button
            onClick={() => scrollToSection('como-funciona')}
            className="block w-full text-left py-2 text-slate-700 font-semibold"
          >
            Como Funciona
          </button>
          <button
            onClick={() => scrollToSection('para-quem')}
            className="block w-full text-left py-2 text-slate-700 font-semibold"
          >
            Para Quem É
          </button>
          <button
            onClick={() => scrollToSection('beneficios')}
            className="block w-full text-left py-2 text-slate-700 font-semibold"
          >
            Diferenciais
          </button>
          <button
            onClick={() => scrollToSection('precos')}
            className="block w-full text-left py-2 text-slate-700 font-semibold"
          >
            Preços
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="block w-full text-left py-2 text-slate-700 font-semibold"
          >
            FAQ
          </button>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl font-bold bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-brand-teal" />
              <span>Entrar na Minha Conta</span>
            </Link>

            <button
              onClick={() => scrollToSection('cadastro')}
              className="w-full py-3 rounded-xl font-bold bg-brand-navy text-white flex items-center justify-center gap-2 shadow-md shadow-brand-navy/20"
            >
              <Store className="w-4 h-4" />
              <span>Criar minha loja grátis</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
