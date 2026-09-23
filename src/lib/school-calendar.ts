// Datas e temas recorrentes no planejamento escolar brasileiro.
// O mesmo catálogo é usado no cadastro do criador e na busca pública.
export const SCHOOL_CALENDAR_TAGS = [
  'Volta às aulas', 'Adaptação escolar', 'Carnaval', 'Dia Internacional da Mulher', 'Dia da Escola',
  'Dia Mundial da Água', 'Dia do Circo', 'Páscoa', 'Dia do Livro Infantil', 'Dia dos Povos Indígenas',
  'Tiradentes', 'Descobrimento do Brasil', 'Dia do Trabalho', 'Dia das Mães', 'Dia da Família',
  'Combate ao Bullying', 'Meio Ambiente', 'Festa Junina', 'Dia dos Namorados', 'Dia do Orgulho Autista',
  'Dia do Soldado', 'Dia do Folclore', 'Dia do Estudante', 'Dia dos Pais', 'Dia do Psicólogo',
  'Semana da Pátria', 'Independência do Brasil', 'Dia da Árvore', 'Primavera', 'Dia do Trânsito',
  'Dia dos Animais', 'Dia das Crianças', 'Dia dos Professores', 'Dia do Médico', 'Halloween',
  'Setembro Amarelo', 'Outubro Rosa', 'Dia da Consciência Negra', 'Proclamação da República', 'Dia da Bandeira', 'Natal', 'Ano Novo',
  'Formatura', 'Cabelo Maluco', 'Dia do Brinquedo', 'Dia do Amigo', 'Dia da Polícia',
  'Educação no Trânsito', 'Educação Financeira', 'Alimentação Saudável', 'Saúde Bucal', 'Inclusão e Acessibilidade',
  'Cultura Afro-Brasileira', 'Cultura Indígena', 'Semana da Criança', 'Projeto de Leitura', 'Projeto de Ciências',
  'Dia Mundial da Saúde', 'Dia da Terra',
] as const;

export type SchoolCalendarTag = typeof SCHOOL_CALENDAR_TAGS[number];

export type SchoolCalendarEventKind =
  | 'data comemorativa'
  | 'data pedagógica'
  | 'ambiental'
  | 'cultural'
  | 'cidadania'
  | 'saúde e bem-estar'
  | 'literatura'
  | 'diversidade e direitos humanos'
  | 'segurança'
  | 'campanha informativa';

export type SchoolCalendarIcon = 'book' | 'calendar' | 'heart' | 'leaf' | 'landmark' | 'palette' | 'shield' | 'sparkles';
export type SchoolCalendarEditorialStatus = 'revisado' | 'requer-revisao';

/**
 * Pequena seleção de datas fixas já usadas como temas no catálogo.
 * São referências de planejamento, não uma relação oficial de feriados.
 * Datas móveis (como Páscoa e Carnaval) permanecem apenas como temas de busca.
 */
export type SchoolCalendarEvent = {
  slug: string;
  name: SchoolCalendarTag;
  month: number;
  day: number;
  kind: SchoolCalendarEventKind;
  description: string;
  searchTerm: SchoolCalendarTag;
  icon: SchoolCalendarIcon;
  sourceName: string;
  sourceUrl?: string;
  reviewedAt: string;
  editorialStatus: SchoolCalendarEditorialStatus;
  displayOrder: number;
};

export const SCHOOL_CALENDAR_ARTWORK: Readonly<Record<string, { src: string; alt: string }>> = {
  'dia-internacional-da-mulher': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração educativa de convivência, cuidado e bem-estar' },
  'dia-da-escola': { src: '/images/calendar/leitura.png', alt: 'Ilustração de livros e materiais de planejamento escolar' },
  'dia-mundial-da-agua': { src: '/images/calendar/dia-da-arvore.png', alt: 'Ilustração de crianças cuidando da natureza' },
  'dia-mundial-da-saude': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração educativa de cuidado e bem-estar' },
  'dia-do-livro-infantil': { src: '/images/calendar/leitura.png', alt: 'Ilustração de livro infantil e materiais de leitura' },
  'dia-dos-povos-indigenas': { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais culturais e criatividade' },
  'dia-da-terra': { src: '/images/calendar/dia-da-arvore.png', alt: 'Ilustração de crianças cuidando de uma árvore e de mudas' },
  'dia-do-trabalho': { src: '/images/calendar/cidadania.png', alt: 'Ilustração de crianças aprendendo sobre cidadania e comunidade' },
  'meio-ambiente': { src: '/images/calendar/dia-da-arvore.png', alt: 'Ilustração de crianças cuidando de uma árvore e de mudas' },
  'festa-junina': { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais culturais e criatividade' },
  'dia-do-folclore': { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais culturais e criatividade' },
  'independencia-do-brasil': { src: '/images/calendar/cidadania.png', alt: 'Ilustração de crianças aprendendo sobre cidadania e comunidade' },
  'dia-da-arvore': {
    src: '/images/calendar/dia-da-arvore.png',
    alt: 'Ilustração de crianças cuidando de uma árvore e de mudas',
  },
  'dia-das-criancas': { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais culturais e criatividade' },
  'dia-dos-professores': { src: '/images/calendar/leitura.png', alt: 'Ilustração de livros e materiais de planejamento escolar' },
  'proclamacao-da-republica': { src: '/images/calendar/cidadania.png', alt: 'Ilustração de crianças aprendendo sobre cidadania e comunidade' },
  'dia-da-bandeira': { src: '/images/calendar/cidadania.png', alt: 'Ilustração de crianças aprendendo sobre cidadania e comunidade' },
  'dia-da-consciencia-negra': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração educativa de convivência, cuidado e bem-estar' },
  natal: { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais culturais e criatividade' },
  'dia-do-transito': {
    src: '/images/calendar/dia-do-transito.png',
    alt: 'Ilustração educativa de crianças, faixa de pedestres, ônibus escolar e semáforo',
  },
};

/** Campanhas panorâmicas trocadas automaticamente conforme o mês do calendário (0 = janeiro). */
export const SCHOOL_CALENDAR_MONTH_ARTWORK = [
  { src: '/images/calendar/mes-01-janeiro.png', alt: 'Ilustração de volta às aulas e acolhimento escolar' },
  { src: '/images/calendar/mes-02-fevereiro.png', alt: 'Ilustração de atividade escolar criativa de carnaval' },
  { src: '/images/calendar/mes-03-marco.png', alt: 'Ilustração de ciência, água e aprendizagem na escola' },
  { src: '/images/calendar/mes-04-abril.png', alt: 'Ilustração de leitura e literatura infantil na escola' },
  { src: '/images/calendar/mes-05-maio.png', alt: 'Ilustração de família, comunidade e projeto escolar' },
  { src: '/images/calendar/mes-06-junho.png', alt: 'Ilustração de festa junina e celebração escolar' },
  { src: '/images/calendar/mes-07-julho.png', alt: 'Ilustração de educação financeira para crianças' },
  { src: '/images/calendar/mes-08-agosto.png', alt: 'Ilustração de folclore, leitura e contação de histórias' },
  { src: '/images/calendar/mes-09-setembro.png', alt: 'Ilustração de cidadania, natureza e educação no trânsito' },
  { src: '/images/calendar/mes-10-outubro.png', alt: 'Ilustração lúdica do mês das crianças' },
  { src: '/images/calendar/mes-11-novembro.png', alt: 'Ilustração de cultura, história e diversidade na escola' },
  { src: '/images/calendar/mes-12-dezembro.png', alt: 'Ilustração de celebração e encerramento do ano escolar' },
] as const;

export function getSchoolCalendarMonthArtwork(month: number) {
  return SCHOOL_CALENDAR_MONTH_ARTWORK[month] || SCHOOL_CALENDAR_MONTH_ARTWORK[0];
}

export const SCHOOL_CALENDAR_EVENTS: readonly SchoolCalendarEvent[] = [
  { slug: 'dia-internacional-da-mulher', name: 'Dia Internacional da Mulher', month: 3, day: 8, kind: 'cidadania', description: 'Tema disponível para apoiar planejamentos e propostas pedagógicas relacionadas à data.', searchTerm: 'Dia Internacional da Mulher', icon: 'heart', sourceName: 'Organização das Nações Unidas', sourceUrl: 'https://www.un.org/en/observances/womens-day', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 20 },
  { slug: 'dia-da-escola', name: 'Dia da Escola', month: 3, day: 15, kind: 'data pedagógica', description: 'Tema de planejamento escolar disponível para explorar no catálogo.', searchTerm: 'Dia da Escola', icon: 'calendar', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 30 },
  { slug: 'dia-mundial-da-agua', name: 'Dia Mundial da Água', month: 3, day: 22, kind: 'ambiental', description: 'Tema disponível para localizar materiais e propostas relacionadas à água.', searchTerm: 'Dia Mundial da Água', icon: 'leaf', sourceName: 'Ministério do Meio Ambiente e Mudança do Clima', sourceUrl: 'https://www.gov.br/mma/pt-br/canais_atendimento/atendimento-a-imprensa/datas-comemorativas', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 40 },
  { slug: 'dia-mundial-da-saude', name: 'Dia Mundial da Saúde', month: 4, day: 7, kind: 'saúde e bem-estar', description: 'Tema de planejamento para encontrar materiais voltados ao cuidado e bem-estar.', searchTerm: 'Dia Mundial da Saúde', icon: 'heart', sourceName: 'Organização Mundial da Saúde', sourceUrl: 'https://www.who.int/campaigns/world-health-day', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 50 },
  { slug: 'dia-do-livro-infantil', name: 'Dia do Livro Infantil', month: 4, day: 18, kind: 'literatura', description: 'Tema disponível para apoiar propostas de leitura e literatura infantil.', searchTerm: 'Dia do Livro Infantil', icon: 'book', sourceName: 'Lei nº 10.402/2002', sourceUrl: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10402.htm', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 60 },
  { slug: 'dia-dos-povos-indigenas', name: 'Dia dos Povos Indígenas', month: 4, day: 19, kind: 'diversidade e direitos humanos', description: 'Tema disponível para organizar pesquisas e materiais pedagógicos relacionados.', searchTerm: 'Dia dos Povos Indígenas', icon: 'landmark', sourceName: 'Fundação Nacional dos Povos Indígenas', sourceUrl: 'https://www.gov.br/funai/pt-br/assuntos/noticias/2026/abril-indigena-estudantes-de-brasilia-conhecem-a-funai-e-ampliam-olhar-sobre-a-diversidade-dos-povos-indigenas', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 70 },
  { slug: 'dia-da-terra', name: 'Dia da Terra', month: 4, day: 22, kind: 'ambiental', description: 'Tema de planejamento para projetos sobre natureza, ambiente e sustentabilidade.', searchTerm: 'Dia da Terra', icon: 'leaf', sourceName: 'Ministério do Meio Ambiente e Mudança do Clima', sourceUrl: 'https://www.gov.br/mma/pt-br/canais_atendimento/atendimento-a-imprensa/datas-comemorativas', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 80 },
  { slug: 'dia-do-trabalho', name: 'Dia do Trabalho', month: 5, day: 1, kind: 'cidadania', description: 'Tema disponível para pesquisas e atividades adequadas ao contexto escolar.', searchTerm: 'Dia do Trabalho', icon: 'landmark', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 90 },
  { slug: 'meio-ambiente', name: 'Meio Ambiente', month: 6, day: 5, kind: 'ambiental', description: 'Tema de planejamento para encontrar recursos sobre cuidado e meio ambiente.', searchTerm: 'Meio Ambiente', icon: 'leaf', sourceName: 'Ministério do Meio Ambiente e Mudança do Clima', sourceUrl: 'https://www.gov.br/mma/pt-br/canais_atendimento/atendimento-a-imprensa/datas-comemorativas', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 100 },
  { slug: 'festa-junina', name: 'Festa Junina', month: 6, day: 24, kind: 'cultural', description: 'Tema cultural disponível para localizar materiais de planejamento para o período junino.', searchTerm: 'Festa Junina', icon: 'palette', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 110 },
  { slug: 'dia-do-folclore', name: 'Dia do Folclore', month: 8, day: 22, kind: 'cultural', description: 'Tema disponível para descobrir materiais ligados à cultura popular brasileira.', searchTerm: 'Dia do Folclore', icon: 'palette', sourceName: 'Sistema Nacional de Bibliotecas Públicas', sourceUrl: 'https://www.gov.br/cultura/pt-br/assuntos/sistema-nacional-de-bibliotecas-publicas-snbp/publicacoes-2/livros-e-pesquisas/bibliotecapublica_principiosdiretrizes_edicao2.pdf', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 120 },
  { slug: 'independencia-do-brasil', name: 'Independência do Brasil', month: 9, day: 7, kind: 'cidadania', description: 'Tema disponível para apoiar pesquisas e atividades escolares relacionadas.', searchTerm: 'Independência do Brasil', icon: 'landmark', sourceName: 'Biblioteca Nacional Digital', sourceUrl: 'https://bndigital.bn.gov.br/dossies/gramaticas-e-dicionarios-do-portugues/linha-do-tempo/sobre-as-efemerides/1822-independencia-do-brasil/', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 130 },
  { slug: 'dia-da-arvore', name: 'Dia da Árvore', month: 9, day: 21, kind: 'ambiental', description: 'Tema disponível para projetos pedagógicos sobre natureza e preservação.', searchTerm: 'Dia da Árvore', icon: 'leaf', sourceName: 'Agência Nacional de Saúde Suplementar', sourceUrl: 'https://www.gov.br/ans/pt-br/arquivos/acesso-a-informacao/transparencia-institucional/planos-de-gestao-de-logistica-sustentavel/relatorio_pls_20172018_semgov.pdf', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 140 },
  { slug: 'dia-do-transito', name: 'Dia do Trânsito', month: 9, day: 25, kind: 'segurança', description: 'Tema de planejamento para materiais sobre convivência e segurança no trânsito.', searchTerm: 'Dia do Trânsito', icon: 'shield', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 150 },
  { slug: 'dia-das-criancas', name: 'Dia das Crianças', month: 10, day: 12, kind: 'data comemorativa', description: 'Tema disponível para propostas lúdicas e atividades voltadas à infância.', searchTerm: 'Dia das Crianças', icon: 'sparkles', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 160 },
  { slug: 'dia-dos-professores', name: 'Dia dos Professores', month: 10, day: 15, kind: 'data pedagógica', description: 'Tema disponível para reconhecer o trabalho docente em projetos pedagógicos.', searchTerm: 'Dia dos Professores', icon: 'calendar', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 170 },
  { slug: 'proclamacao-da-republica', name: 'Proclamação da República', month: 11, day: 15, kind: 'cidadania', description: 'Tema disponível para pesquisas e propostas pedagógicas relacionadas à história do Brasil.', searchTerm: 'Proclamação da República', icon: 'landmark', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 180 },
  { slug: 'dia-da-bandeira', name: 'Dia da Bandeira', month: 11, day: 19, kind: 'cidadania', description: 'Tema disponível para organizar pesquisas e materiais relacionados a símbolos nacionais.', searchTerm: 'Dia da Bandeira', icon: 'landmark', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 190 },
  { slug: 'dia-da-consciencia-negra', name: 'Dia da Consciência Negra', month: 11, day: 20, kind: 'diversidade e direitos humanos', description: 'Tema disponível para encontrar materiais relacionados à educação e cultura afro-brasileira.', searchTerm: 'Dia da Consciência Negra', icon: 'heart', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 200 },
  { slug: 'natal', name: 'Natal', month: 12, day: 25, kind: 'cultural', description: 'Tema disponível para planejamentos e materiais de encerramento do ano.', searchTerm: 'Natal', icon: 'sparkles', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 210 },
] as const;

export function getSchoolCalendarEventsForMonth(month: number): SchoolCalendarEvent[] {
  return [...SCHOOL_CALENDAR_EVENTS].filter((event) => event.month - 1 === month).sort((a, b) => a.day - b.day || a.displayOrder - b.displayOrder);
}

export function getSchoolCalendarEvent(slug: string): SchoolCalendarEvent | undefined {
  return SCHOOL_CALENDAR_EVENTS.find((event) => event.slug === slug);
}

export function getSchoolCalendarEventKinds(): SchoolCalendarEventKind[] {
  return [...new Set(SCHOOL_CALENDAR_EVENTS.map((event) => event.kind))];
}

const MONTHLY_TAGS: Record<number, SchoolCalendarTag[]> = {
  0: ['Volta às aulas', 'Adaptação escolar', 'Ano Novo', 'Formatura'],
  1: ['Carnaval', 'Dia Internacional da Mulher', 'Combate ao Bullying'],
  2: ['Dia da Escola', 'Dia Mundial da Água', 'Dia do Circo', 'Projeto de Ciências'],
  3: ['Páscoa', 'Dia do Livro Infantil', 'Dia dos Povos Indígenas', 'Tiradentes', 'Dia Mundial da Saúde', 'Dia da Terra', 'Projeto de Leitura'],
  4: ['Dia do Trabalho', 'Dia das Mães', 'Dia da Família', 'Dia do Soldado'],
  5: ['Meio Ambiente', 'Festa Junina', 'Dia do Orgulho Autista', 'Dia dos Namorados', 'Alimentação Saudável'],
  6: ['Festa Junina', 'Educação Financeira', 'Inclusão e Acessibilidade'],
  7: ['Dia dos Pais', 'Dia do Estudante', 'Dia do Folclore', 'Dia do Psicólogo', 'Dia do Amigo'],
  8: ['Semana da Pátria', 'Independência do Brasil', 'Dia da Árvore', 'Primavera', 'Dia do Trânsito', 'Setembro Amarelo', 'Educação no Trânsito'],
  9: ['Dia das Crianças', 'Dia dos Professores', 'Cabelo Maluco', 'Halloween', 'Dia dos Animais', 'Dia do Médico', 'Outubro Rosa', 'Semana da Criança', 'Dia do Brinquedo'],
  10: ['Dia da Consciência Negra', 'Proclamação da República', 'Dia da Bandeira', 'Cultura Afro-Brasileira', 'Cultura Indígena', 'Saúde Bucal'],
  11: ['Natal', 'Ano Novo', 'Formatura', 'Dia da Polícia'],
};

export function getSchoolCalendarTagsForMonth(month = new Date().getMonth()): SchoolCalendarTag[] {
  return MONTHLY_TAGS[month] || [];
}

/**
 * Toda tag do calendário recebe uma imagem de campanha. Quando não há uma
 * ilustração exclusiva, a arte do mês mantém a experiência visual consistente
 * sem duplicar dezenas de arquivos grandes no carregamento inicial.
 */
export function getSchoolCalendarArtworkForTag(tag: SchoolCalendarTag) {
  const event = SCHOOL_CALENDAR_EVENTS.find((item) => item.searchTerm === tag);
  if (event && SCHOOL_CALENDAR_ARTWORK[event.slug]) return SCHOOL_CALENDAR_ARTWORK[event.slug];

  const month = Object.entries(MONTHLY_TAGS).find(([, tags]) => tags.includes(tag))?.[0];
  return getSchoolCalendarMonthArtwork(month ? Number(month) : 0);
}

const UPCOMING_EVENTS: Array<{ tag: SchoolCalendarTag; month: number; day: number }> = [
  { tag: 'Volta às aulas', month: 1, day: 1 }, { tag: 'Carnaval', month: 2, day: 1 }, { tag: 'Dia Internacional da Mulher', month: 3, day: 8 },
  { tag: 'Dia Mundial da Água', month: 3, day: 22 }, { tag: 'Páscoa', month: 4, day: 1 }, { tag: 'Dia dos Povos Indígenas', month: 4, day: 19 },
  { tag: 'Dia das Mães', month: 5, day: 10 }, { tag: 'Meio Ambiente', month: 6, day: 5 }, { tag: 'Festa Junina', month: 6, day: 24 },
  { tag: 'Dia dos Pais', month: 8, day: 9 }, { tag: 'Dia do Folclore', month: 8, day: 22 }, { tag: 'Dia do Soldado', month: 8, day: 25 },
  { tag: 'Setembro Amarelo', month: 9, day: 1 }, { tag: 'Independência do Brasil', month: 9, day: 7 }, { tag: 'Dia da Árvore', month: 9, day: 21 },
  { tag: 'Primavera', month: 9, day: 22 }, { tag: 'Dia do Trânsito', month: 9, day: 25 }, { tag: 'Dia das Crianças', month: 10, day: 12 },
  { tag: 'Dia dos Professores', month: 10, day: 15 }, { tag: 'Outubro Rosa', month: 10, day: 1 }, { tag: 'Dia da Consciência Negra', month: 11, day: 20 },
  { tag: 'Natal', month: 12, day: 25 },
];

export function getUpcomingSchoolEvents(now = new Date(), limit = 7) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return UPCOMING_EVENTS.map((event) => {
    let date = new Date(today.getFullYear(), event.month - 1, event.day);
    if (date < today) date = new Date(today.getFullYear() + 1, event.month - 1, event.day);
    return { ...event, date, daysUntil: Math.ceil((date.getTime() - today.getTime()) / 86_400_000) };
  }).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, limit);
}
