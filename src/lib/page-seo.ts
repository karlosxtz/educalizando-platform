import type { Metadata } from 'next';
import { SITE_URL, socialMetadata } from './seo';

export const PAGE_SEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  '/': {
    title: 'Educalizando: plataforma de materiais didáticos',
    description: 'Na Educalizando, encontre atividades, apostilas e jogos pedagógicos digitais. Conheça lojas de educadores ou crie sua loja de materiais didáticos.',
    keywords: ['materiais didáticos digitais para professores', 'recursos pedagógicos', 'planos de aula BNCC'],
  },
  '/buscar': {
    title: 'Atividades pedagógicas para baixar',
    description: 'Busque atividades pedagógicas para baixar, apostilas e planos de aula por tema ou ano escolar. Encontre recursos para sua turma e explore o catálogo!',
    keywords: ['atividades pedagógicas para baixar', 'apostilas para professores', 'planos de aula'],
  },
  '/buscar?categoria=alfabetizacao': {
    title: 'Atividades de alfabetização para imprimir',
    description: 'Explore atividades de alfabetização para imprimir com letras, sílabas, leitura e escrita. Apoie o aprendizado da sua turma e escolha seus materiais!',
    keywords: ['atividades de alfabetização para imprimir', 'letramento', 'sílabas e letras'],
  },
  '/atividades-ensino-fundamental': {
    title: 'Atividades ensino fundamental para imprimir',
    description: 'Encontre atividades ensino fundamental para imprimir por ano e disciplina. Apoie seu planejamento com recursos pedagógicos e explore as opções!',
    keywords: ['atividades ensino fundamental para imprimir', 'anos iniciais e finais', 'planejamento BNCC'],
  },
  '/buscar?categoria=matematica': {
    title: 'Atividades de matemática para imprimir',
    description: 'Descubra atividades de matemática para imprimir com números, operações e desafios. Facilite o planejamento das aulas e encontre materiais para sua turma!',
    keywords: ['atividades de matemática para imprimir', 'operações matemáticas', 'jogos de matemática'],
  },
  '/buscar?categoria=artes': {
    title: 'Atividades de artes para sala de aula',
    description: 'Encontre atividades de artes para sala de aula com propostas de criação, cores e expressão. Inspire o trabalho com sua turma e explore os materiais!',
    keywords: ['atividades de artes para sala de aula', 'educação artística', 'cores e expressão'],
  },
  '/buscar?categoria=historia': {
    title: 'Atividades de história no ensino fundamental',
    description: 'Busque atividades de história para ensino fundamental por tema. Trabalhe fontes, culturas e períodos históricos nas suas aulas. Explore os materiais!',
    keywords: ['atividades de história para ensino fundamental', 'fontes históricas', 'ensino de história'],
  },
  '/buscar?categoria=ensino-religioso': {
    title: 'Atividades de ensino religioso para imprimir',
    description: 'Explore atividades de ensino religioso para imprimir por tema e etapa escolar. Encontre propostas para apoiar suas aulas e escolha os materiais!',
    keywords: ['atividades de ensino religioso para imprimir', 'diversidade religiosa', 'educação religiosa'],
  },
  '/buscar?categoria=bercario': {
    title: 'Atividades para berçário e maternal',
    description: 'Encontre atividades para berçário e maternal com ideias de brincadeiras, descobertas e rotina. Planeje propostas para os pequenos e explore o acervo!',
    keywords: ['atividades para berçário e maternal', 'brincadeiras para bebês', 'educação infantil'],
  },
  '/atividades-para-imprimir': {
    title: 'Atividades escolares para imprimir',
    description: 'Encontre atividades para imprimir por tema e etapa escolar. Compare prévias, formatos e preços dos materiais e escolha recursos para suas aulas.',
    keywords: ['atividades pedagógicas para imprimir grátis', 'atividades em PDF', 'recursos para sala de aula'],
  },
  '/atividades-por-ano/ensino-fundamental-1': {
    title: 'Atividades do 1º ao 5º ano para imprimir',
    description: 'Explore atividades do 1º ao 5º ano do ensino fundamental para leitura, escrita e matemática. Apoie o planejamento com a BNCC e encontre recursos!',
    keywords: ['atividades 1º ao 5º ano ensino fundamental', 'anos iniciais BNCC', 'atividades para imprimir'],
  },
  '/atividades-por-ano/ensino-fundamental-2': {
    title: 'Atividades do 6º ao 9º ano para imprimir',
    description: 'Encontre atividades do 6º ao 9º ano do ensino fundamental por disciplina. Planeje aulas considerando a BNCC e explore materiais para sua turma!',
    keywords: ['atividades 6º ao 9º ano ensino fundamental', 'anos finais BNCC', 'atividades por disciplina'],
  },
  '/atividades-por-ano/ensino-medio': {
    title: 'Atividades ensino médio, ENEM e BNCC',
    description: 'Busque atividades para ensino médio, ENEM e BNCC por área de conhecimento. Apoie aulas, revisões e avaliações com recursos digitais. Veja as opções!',
    keywords: ['atividades ensino médio ENEM BNCC', 'avaliações ensino médio', 'revisão para ENEM'],
  },
  '/atividades-por-ano/pre-vestibular-enem': {
    title: 'Materiais de estudo pré-vestibular e ENEM',
    description: 'Encontre materiais de estudo pré-vestibular e ENEM para organizar revisões e praticar conteúdos. Explore apostilas e recursos para sua preparação!',
    keywords: ['materiais de estudo pré-vestibular e ENEM', 'apostilas vestibular', 'preparação para ENEM'],
  },
  '/cadastro/produtor': {
    title: 'Vender materiais didáticos online',
    description: 'Quer vender materiais didáticos online? Crie sua loja na Educalizando, publique recursos digitais e alcance professores de todo o Brasil. Cadastre-se!',
    keywords: ['vender materiais didáticos online', 'como vender materiais didáticos pela internet', 'vender apostilas'],
  },
  '/afiliados/cadastro': {
    title: 'Indique materiais educacionais como afiliado',
    description: 'Quer ganhar dinheiro indicando materiais educacionais? Conheça o programa de afiliados, confira as regras de comissão e cadastre-se na Educalizando!',
    keywords: ['ganhar dinheiro indicando materiais educacionais', 'afiliados educação', 'comissão por indicação'],
  },
  '/ajuda': {
    title: 'Central de ajuda para compradores e criadores',
    description: 'Na central de ajuda Educalizando, tire dúvidas sobre compras, acesso aos materiais e vendas. Encontre orientações para usar a plataforma. Acesse!',
    keywords: ['central de ajuda Educalizando', 'acessar materiais comprados', 'suporte para criadores'],
  },
};

export function pageMetadata(path: string): Metadata {
  const entry = PAGE_SEO[path];
  const title = path === '/' ? entry.title : shortSeoTitle(entry.title);
  return {
    metadataBase: new URL(SITE_URL), title: { absolute: title },
    description: entry.description, keywords: entry.keywords,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    alternates: { canonical: new URL(path, SITE_URL).href },
    ...socialMetadata({ title, description: entry.description, url: path }),
  };
}

/** Preserve the registered name, dropping marketing suffixes before any content. */
export function shortSeoTitle(name: string, suffix = ' | Educalizando', _preserveEnding = false) {
  const clean = name.replace(/\s+/g, ' ').trim();
  for (const ending of [suffix, ' | Educalizando', '']) {
    if (clean.length + ending.length <= 60) return clean + ending;
  }
  // Sixty characters is an editorial target, not a reason to mutilate a name.
  return clean;
}

export function productSeoText(value: string) {
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ').trim();
}

export function productSeoDescription(title: string, description?: string | null) {
  const clean = productSeoText(description || '') || `Conheça ${productSeoText(title)} na Educalizando. Material didático digital para professores e educadores.`;
  if (clean.length <= 155) return clean;
  return clean.slice(0, 154).replace(/\s+\S*$/, '').trimEnd() + '…';
}

export function storeSeoDescription(name: string, count: number, category: string) {
  const label = count === 1 ? '1 material didático' : count + ' materiais didáticos';
  const intro = productSeoText(name) + ': ' + label + '.';
  for (const ending of [' Recursos de ' + category + '. Explore a loja na Educalizando.', ' Explore a loja na Educalizando.', '']) {
    if (intro.length + ending.length <= 155) return intro + ending;
  }
  return intro;
}
