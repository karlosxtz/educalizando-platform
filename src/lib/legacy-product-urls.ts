import { SITE_URL } from './seo';

// Historical URLs verified against the published product. The UUID alias below
// previously required a streamed HTML refresh; handle it before rendering instead.
// Never infer matches or rewrite creator slugs at runtime.
export const LEGACY_PRODUCT_URLS: Record<string, string> = {
  'arte-primavera-y66a': 'arte-primavera',
  'caixa-das-frases-40-frases-em-letra-cursiva-e-letra-bastao-62ce': 'caixa-das-frases-40-frases-em-letra-cursiva-e-letra-bastao',
  'lap-book-interativo-renascimento': 'lap-book-interativo-renascimento-7-ano',
  'f08965bd-960b-4e4b-960a-782f663909d1': 'historinha-da-primavera-o-jardim-encantado-um-recurso-encantador-para-trabalhar-o-tema-primavera-de-forma-ludica-colorida-e-divertida-com-as-criancas-o-que-acompanha-historinha-da-primavera-em-plaquinhas-1-viseira-tematica-2-atividades-para-complementar-a-aprendizagem-plr-total-r-16-90-preco-para-venda-apenas-r-7-00-perfeito-para-momentos-de-contacao-de-historias-atividades-em-sala-e-para-deixar-a-chegada-da-primavera-ainda-mais-especi',
};

export function legacyProductRedirect(request: Request): Response | null {
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  const url = new URL(request.url);
  const match = /^\/produto\/([^/]+)\/?$/.exec(url.pathname);
  if (!match) return null;
  const slug = Object.hasOwn(LEGACY_PRODUCT_URLS, match[1]) ? LEGACY_PRODUCT_URLS[match[1]] : undefined;
  if (!slug) return null;
  const target = new URL('/produto/' + encodeURIComponent(slug), SITE_URL);
  target.search = url.search;
  return new Response(null, { status: 301, headers: { Location: target.href } });
}
