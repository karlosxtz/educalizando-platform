import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Merchant Center exige regras explícitas para a página e a imagem do
      // produto, mesmo quando a regra genérica também permitiria o acesso.
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Googlebot-Image', allow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/cliente/',
          '/aluno/',
          '/api/',
          '/checkout/',
          '/loja/*/checkout/',
        ],
      },
    ],
    sitemap: 'https://www.educalizando.com.br/sitemap.xml',
  };
}
