import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/dashboard/',
        '/cliente/',
        '/aluno/',
        '/api/',
        '/checkout/',
        '/loja/*/checkout/'
      ],
    },
    sitemap: 'https://www.educalizando.com.br/sitemap.xml',
  };
}
