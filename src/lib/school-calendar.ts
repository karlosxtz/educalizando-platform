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
  'Dia da Consciência Negra', 'Proclamação da República', 'Dia da Bandeira', 'Natal', 'Ano Novo',
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
