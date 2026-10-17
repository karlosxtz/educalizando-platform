import type { NextConfig } from "next";

const developmentScriptPolicy = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${developmentScriptPolicy};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.checkout.infinitepay.io https://api.asaas.com https://arquivos.educalizando.com.br;
  frame-src 'self' https://www.youtube.com;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy }
];

const nextConfig: NextConfig = {
  // Keep the self-hosted build separate from the existing Cloudflare artefacts.
  ...(process.env.EDUCALIZANDO_NODE_BUILD === '1' ? {
    output: 'standalone' as const,
    distDir: '.next-vps',
    typescript: { tsconfigPath: 'tsconfig.vps.json' },
  } : {}),
  trailingSlash: false,
  images: { unoptimized: true },
  // Product metadata must be present in the initial <head>. This makes the
  // canonical URL, site name and cover image deterministic for search and
  // shopping crawlers instead of appending them after </head> as a stream.
  htmlLimitedBots: /.*/,
  async redirects() {
    return [
      ...['.*\\.vercel\\.app', '.*\\.workers\\.dev', '.*\\.pages\\.dev'].map(value => ({
        source: '/:path*',
        has: [{ type: 'host' as const, value }],
        destination: 'https://www.educalizando.com.br/:path*',
        statusCode: 301 as const,
      })),
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'educalizando.com.br' }],
        destination: 'https://www.educalizando.com.br/:path*',
        statusCode: 301,
      },
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'www.educalizando.com.br' },
          { type: 'header', key: 'x-forwarded-proto', value: 'http' },
        ],
        destination: 'https://www.educalizando.com.br/:path*',
        statusCode: 301,
      },
      {
        source: '/vender',
        destination: '/cadastro/produtor',
        statusCode: 301,
      },
      // URL histórica já registrada pelo Google antes da padronização do slug.
      // A regra é aplicada antes da página para responder com 308 a todo crawler.
      {
        source: '/produto/kit-das-caixinhas-da-alfabetizacao-yvy5',
        destination: '/produto/kit-das-caixinhas-da-alfabetizacao',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/cliente', destination: '/aluno' },
      { source: '/cliente/:path*', destination: '/aluno/:path*' },
    ];
  },
  async headers() {
    return [
      ...['/', '/lojas', '/ofertas', '/loja/:slug', '/produto/:slug', '/kit/:id', '/clube/:slug', '/loja/:slug/produto/:produtoSlug', '/loja/:slug/kit/:id', '/categorias/:slug', '/sitemap.xml', '/sitemap-catalogo.xml'].map(source => ({
        source,
        // These documents read only the public catalogue. The edge cache also
        // rejects every session, query parameter and React navigation variant.
        headers: [{ key: 'X-Educalizando-Public-Document', value: '1' }],
      })),
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      ...[
        '/admin/:path*',
        '/dashboard/:path*',
        '/painel/:path*',
        '/checkout/:path*',
        '/loja/:slug/checkout/:path*',
        '/login',
        '/entrar',
        '/afiliados/login',
        '/aluno/login',
        '/cliente/login',
        '/seguranca',
        '/redefinir-senha',
        '/auth/:path*',
        '/carrinho',
        '/offline',
        '/recuperar-carrinho/:path*',
        '/aluno/:path*',
        '/cliente/:path*',
      ].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ];
  },
};

export default nextConfig;
