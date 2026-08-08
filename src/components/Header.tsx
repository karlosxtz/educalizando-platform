'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Menu, X, Store } from 'lucide-react';

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
          ? 'bg-[#0b0f19]/90 backdrop-blur-md border-b border-white/10 py-3 shadow-xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5722] to-[#6366f1] flex items-center justify-center shadow-lg shadow-[#ff5722]/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white">
              Educa<span className="text-[#ff5722]">lizando</span>
            </span>
            <span className="block text-[0.65rem] font-bold text-slate-400 tracking-widest uppercase -mt-1">
              Para Criadores Didáticos
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <button
            onClick={() => scrollToSection('como-funciona')}
            className="hover:text-white transition-colors"
          >
            Como Funciona
          </button>
          <button
            onClick={() => scrollToSection('para-quem')}
            className="hover:text-white transition-colors"
          >
            Para Quem É
          </button>
          <button
            onClick={() => scrollToSection('beneficios')}
            className="hover:text-white transition-colors"
          >
            Diferenciais
          </button>
          <button
            onClick={() => scrollToSection('precos')}
            className="hover:text-white transition-colors"
          >
            Preços
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="hover:text-white transition-colors"
          >
            FAQ
          </button>
        </nav>

        {/* CTA Button */}
        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={() => scrollToSection('cadastro')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#ff5722] to-[#ea580c] text-white shadow-lg shadow-[#ff5722]/25 hover:shadow-[#ff5722]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
          >
            <Store className="w-4 h-4" />
            Criar minha loja grátis
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-300 hover:text-white focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0b0f19]/95 backdrop-blur-xl border-b border-white/10 px-4 pt-4 pb-6 space-y-3">
          <button
            onClick={() => scrollToSection('como-funciona')}
            className="block w-full text-left py-2 text-slate-200 font-semibold"
          >
            Como Funciona
          </button>
          <button
            onClick={() => scrollToSection('para-quem')}
            className="block w-full text-left py-2 text-slate-200 font-semibold"
          >
            Para Quem É
          </button>
          <button
            onClick={() => scrollToSection('beneficios')}
            className="block w-full text-left py-2 text-slate-200 font-semibold"
          >
            Diferenciais
          </button>
          <button
            onClick={() => scrollToSection('precos')}
            className="block w-full text-left py-2 text-slate-200 font-semibold"
          >
            Preços
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="block w-full text-left py-2 text-slate-200 font-semibold"
          >
            FAQ
          </button>
          <button
            onClick={() => scrollToSection('cadastro')}
            className="w-full py-3 rounded-xl font-bold bg-[#ff5722] text-white flex items-center justify-center gap-2"
          >
            <Store className="w-4 h-4" />
            Criar minha loja grátis
          </button>
        </div>
      )}
    </header>
  );
}
