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
] as const;

export type SchoolCalendarTag = typeof SCHOOL_CALENDAR_TAGS[number];

export type SchoolCalendarEventKind = 'data comemorativa' | 'tema escolar' | 'campanha informativa';

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
};

export const SCHOOL_CALENDAR_EVENTS: readonly SchoolCalendarEvent[] = [
  { slug: 'dia-internacional-da-mulher', name: 'Dia Internacional da Mulher', month: 3, day: 8, kind: 'data comemorativa', description: 'Tema disponível para apoiar planejamentos e propostas pedagógicas relacionadas à data.', searchTerm: 'Dia Internacional da Mulher' },
  { slug: 'dia-da-escola', name: 'Dia da Escola', month: 3, day: 15, kind: 'data comemorativa', description: 'Tema de planejamento escolar disponível para explorar no catálogo.', searchTerm: 'Dia da Escola' },
  { slug: 'dia-mundial-da-agua', name: 'Dia Mundial da Água', month: 3, day: 22, kind: 'data comemorativa', description: 'Tema disponível para localizar materiais e propostas relacionadas à água.', searchTerm: 'Dia Mundial da Água' },
  { slug: 'dia-do-livro-infantil', name: 'Dia do Livro Infantil', month: 4, day: 18, kind: 'data comemorativa', description: 'Tema disponível para apoiar propostas de leitura e literatura infantil.', searchTerm: 'Dia do Livro Infantil' },
  { slug: 'dia-dos-povos-indigenas', name: 'Dia dos Povos Indígenas', month: 4, day: 19, kind: 'data comemorativa', description: 'Tema disponível para organizar pesquisas e materiais pedagógicos relacionados.', searchTerm: 'Dia dos Povos Indígenas' },
  { slug: 'dia-do-trabalho', name: 'Dia do Trabalho', month: 5, day: 1, kind: 'data comemorativa', description: 'Tema disponível para pesquisas e atividades adequadas ao contexto escolar.', searchTerm: 'Dia do Trabalho' },
  { slug: 'meio-ambiente', name: 'Meio Ambiente', month: 6, day: 5, kind: 'campanha informativa', description: 'Tema de planejamento para encontrar recursos sobre cuidado e meio ambiente.', searchTerm: 'Meio Ambiente' },
  { slug: 'dia-do-folclore', name: 'Dia do Folclore', month: 8, day: 22, kind: 'data comemorativa', description: 'Tema disponível para descobrir materiais ligados à cultura popular brasileira.', searchTerm: 'Dia do Folclore' },
  { slug: 'independencia-do-brasil', name: 'Independência do Brasil', month: 9, day: 7, kind: 'data comemorativa', description: 'Tema disponível para apoiar pesquisas e atividades escolares relacionadas.', searchTerm: 'Independência do Brasil' },
  { slug: 'dia-da-arvore', name: 'Dia da Árvore', month: 9, day: 21, kind: 'data comemorativa', description: 'Tema disponível para projetos pedagógicos sobre natureza e preservação.', searchTerm: 'Dia da Árvore' },
  { slug: 'dia-das-criancas', name: 'Dia das Crianças', month: 10, day: 12, kind: 'data comemorativa', description: 'Tema disponível para propostas lúdicas e atividades voltadas à infância.', searchTerm: 'Dia das Crianças' },
  { slug: 'dia-dos-professores', name: 'Dia dos Professores', month: 10, day: 15, kind: 'data comemorativa', description: 'Tema disponível para reconhecer o trabalho docente em projetos pedagógicos.', searchTerm: 'Dia dos Professores' },
  { slug: 'dia-da-consciencia-negra', name: 'Dia da Consciência Negra', month: 11, day: 20, kind: 'data comemorativa', description: 'Tema disponível para encontrar materiais relacionados à educação e cultura afro-brasileira.', searchTerm: 'Dia da Consciência Negra' },
  { slug: 'natal', name: 'Natal', month: 12, day: 25, kind: 'data comemorativa', description: 'Tema disponível para planejamentos e materiais de encerramento do ano.', searchTerm: 'Natal' },
] as const;

export function getSchoolCalendarEventsForMonth(month: number): SchoolCalendarEvent[] {
  return SCHOOL_CALENDAR_EVENTS.filter((event) => event.month - 1 === month);
}

export function getSchoolCalendarEvent(slug: string): SchoolCalendarEvent | undefined {
  return SCHOOL_CALENDAR_EVENTS.find((event) => event.slug === slug);
}

const MONTHLY_TAGS: Record<number, SchoolCalendarTag[]> = {
  0: ['Volta às aulas', 'Adaptação escolar'],
  1: ['Carnaval', 'Dia Internacional da Mulher'],
  2: ['Dia da Escola', 'Dia Mundial da Água', 'Dia do Circo'],
  3: ['Páscoa', 'Dia do Livro Infantil', 'Dia dos Povos Indígenas', 'Tiradentes'],
  4: ['Dia do Trabalho', 'Dia das Mães', 'Dia da Família'],
  5: ['Meio Ambiente', 'Festa Junina', 'Dia do Orgulho Autista'],
  6: ['Festa Junina', 'Educação Financeira'],
  7: ['Dia dos Pais', 'Dia do Estudante', 'Dia do Folclore', 'Dia do Soldado'],
  8: ['Semana da Pátria', 'Independência do Brasil', 'Dia da Árvore', 'Primavera', 'Dia do Trânsito'],
  9: ['Dia das Crianças', 'Dia dos Professores', 'Cabelo Maluco', 'Halloween'],
  10: ['Dia da Consciência Negra', 'Proclamação da República', 'Dia da Bandeira'],
  11: ['Natal', 'Ano Novo', 'Formatura'],
};

export function getSchoolCalendarTagsForMonth(month = new Date().getMonth()): SchoolCalendarTag[] {
  return MONTHLY_TAGS[month] || [];
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
