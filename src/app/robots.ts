import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const publicPaths = ['/', '/aluno/login', '/aluno/cadastro', '/api/storage/public-image'];
  const privatePaths = [
    '/admin/',
    '/dashboard/',
    '/cliente/',
    '/aluno/',
    '/api/',
    '/checkout/',
    '/loja/*/checkout/',
  ];

  return {
    rules: [
      // Merchant Center exige regras explícitas para a página e a imagem do
      // produto, mesmo quando a regra genérica também permitiria o acesso.
      { userAgent: 'Googlebot', allow: publicPaths, disallow: privatePaths },
      { userAgent: 'Googlebot-Image', allow: '/' },
      {
        userAgent: '*',
        // As telas de autenticação precisam ser rastreáveis para que o
        // `noindex` seja respeitado. As demais rotas de aluno continuam
        // bloqueadas por conterem conteúdo privado.
        allow: publicPaths,
        disallow: privatePaths,
      },
    ],
    sitemap: 'https://www.educalizando.com.br/sitemap.xml',
  };
}
