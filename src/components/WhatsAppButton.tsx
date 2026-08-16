'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Retrasar a exibição para que não salte de imediato, e apenas no lado do cliente
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  // Número de suporte
  const phoneNumber = '5521965008441';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Olá! Preciso de ajuda de suporte na plataforma Educalizando.')}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center"
      title="Suporte via WhatsApp"
    >
      <div className="relative group">
        {/* Glow animado no fundo */}
        <div className="absolute -inset-2 bg-emerald-500 rounded-full opacity-40 group-hover:opacity-60 blur-md transition-opacity duration-300 animate-pulse" />
        
        {/* Botão flutuante */}
        <Link 
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95"
        >
          <MessageCircle className="w-7 h-7 fill-white" />
        </Link>
        
        {/* Tooltip de texto que aparece ao lado do botão em telas maiores */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap hidden sm:block">
          Falar com o Suporte
          {/* Triângulo do Tooltip */}
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
        </div>
      </div>
    </motion.div>
  );
}
