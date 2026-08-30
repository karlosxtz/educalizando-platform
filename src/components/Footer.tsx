'use client';

import Link from 'next/link';
import { ShieldCheck, MessageCircle, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 text-slate-700 border-t border-slate-200 pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Estrutura de 4 Colunas (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          
          {/* Coluna 1: Marca */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <img
                src="/branding/logo-educalizando.png"
                alt="Educalizando"
                className="h-9 w-auto object-contain"
                style={{ width: 'auto', height: '36px' }}
              />
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              O marketplace onde educadores compartilham e vendem materiais didáticos de qualidade.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/educalizando_brasil/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>

              <a href="https://www.youtube.com/@educalizandobrasil" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all" aria-label="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@educalizando_" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all" aria-label="TikTok">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Coluna 2: Para Compradores */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Para Compradores</h4>
            <ul className="space-y-4">
              <li><Link href="/buscar" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Explorar Categorias</Link></li>
              <li><Link href="/lojas" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Encontrar Lojas</Link></li>
              <li><Link href="/atividades-por-ano" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Atividades por Ano e BNCC</Link></li>
              <li><Link href="/buscar?categoria=combo" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Kits e Combos</Link></li>
              <li><Link href="/aluno/materiais" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Minhas Compras</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Para Vendedores */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Para Vendedores</h4>
            <ul className="space-y-4">
              <li><Link href="/vender" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Comece a Vender</Link></li>
              <li><Link href="/painel" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Painel do Vendedor</Link></li>
              <li><Link href="/afiliados" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Área do Afiliado</Link></li>
            </ul>
          </div>

          {/* Coluna 4: Suporte e Contato */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Suporte e Contato</h4>
            <ul className="space-y-4">
              <li><Link href="/ajuda" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Central de Ajuda</Link></li>
              <li><Link href="/sobre" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Sobre o Educalizando</Link></li>
              <li><Link href="/termos" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Política de Privacidade</Link></li>
              
              <li className="pt-4 space-y-3">
                <a href="https://wa.me/5521965008441" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  (21) 96500-8441
                </a>
                <a href="mailto:educalizando@proton.me" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  educalizando@proton.me
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Barra Inferior (Copyright e Pagamentos) */}
        <div className="border-t border-slate-200 py-6 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-slate-500 font-medium text-center md:text-left">
            &copy; {new Date().getFullYear()} Educalizando. Todos os direitos reservados.
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2 hidden sm:block">Pagamentos Seguros</span>
            <div className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-700 flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Cartão de Crédito
            </div>
            <div className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-700 flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Pix
            </div>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
