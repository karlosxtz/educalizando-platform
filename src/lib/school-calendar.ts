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
