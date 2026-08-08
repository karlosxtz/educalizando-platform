import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#090d16] text-slate-400 text-sm py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff5722] to-[#6366f1] flex items-center justify-center shadow-lg shadow-[#ff5722]/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Educa<span className="text-[#ff5722]">lizando</span>
              </span>
            </div>
            
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              A plataforma definitiva para professores, criadores de conteúdo e editoras venderem e entregarem materiais didáticos digitais com PIX instantâneo.
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Ambiente 100% Criptografado & Seguro</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="#beneficios" className="hover:text-white transition-colors">Diferenciais da Plataforma</a></li>
              <li><a href="#precos" className="hover:text-white transition-colors">Taxas e Comissão</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Perguntas Frequentes</a></li>
              <li><a href="#cadastro" className="text-[#ff5722] font-bold hover:underline">Criar Loja Grátis</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Legal & Suporte</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda ao Criador</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contato & Suporte</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            © {new Date().getFullYear()} Educalizando Plataforma Digital. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-1">
            <span>Desenvolvido com</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>para educadores do Brasil</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
