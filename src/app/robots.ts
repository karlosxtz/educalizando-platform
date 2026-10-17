import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const rules = {
    allow: ['/', '/api/storage/public-image', '/api/storage/public-media'],
    disallow: [
      '/dashboard', '/admin', '/painel', '/aluno', '/cliente', '/api/',
      '/checkout', '/loja/*/checkout', '/login', '/entrar', '/cadastro',
      '/afiliados/login', '/afiliados/cadastro', '/carrinho', '/auth/',
      '/seguranca', '/redefinir-senha', '/retomar-compra/', '/recuperar-carrinho/',
      '/atendimento/', '/solicitar-material-exclusivo/',
    ],
  };
  return {
    rules: [{ userAgent: '*', ...rules }, { userAgent: 'Googlebot', ...rules }],
    sitemap: SITE_URL + '/sitemap.xml',
  };
}
