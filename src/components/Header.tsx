'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Menu, X, Store, LogIn } from 'lucide-react';

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
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 py-3 shadow-xs'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Educa<span className="text-blue-600">lizando</span>
            </span>
            <span className="block text-[0.65rem] font-bold text-slate-500 tracking-widest uppercase -mt-1">
              Para Criadores de Infoprodutos
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <button
            onClick={() => scrollToSection('como-funciona')}
            className="hover:text-blue-600 transition-colors"
          >
            Como Funciona
          </button>
          <button
            onClick={() => scrollToSection('para-quem')}
            className="hover:text-blue-600 transition-colors"
          >
            Para Quem É
          </button>
          <button
            onClick={() => scrollToSection('beneficios')}
            className="hover:text-blue-600 transition-colors"
          >
            Diferenciais
          </button>
          <button
            onClick={() => scrollToSection('precos')}
            className="hover:text-blue-600 transition-colors"
          >
            Preços
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="hover:text-blue-600 transition-colors"
          >
            FAQ
          </button>
        </nav>

        {/* CTA Buttons Header */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center gap-2"
          >
            <LogIn className="w-4 h-4 text-blue-600" />
            <span>Entrar</span>
          </Link>

          <button
            onClick={() => scrollToSection('cadastro')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
          >
            <Store className="w-4 h-4" />
            <span>Criar minha loja grátis</span>
            <ArrowRight className="w-4 h-4" />
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
              <LogIn className="w-4 h-4 text-blue-600" />
              <span>Entrar na Minha Conta</span>
            </Link>

            <button
              onClick={() => scrollToSection('cadastro')}
              className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white flex items-center justify-center gap-2"
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
