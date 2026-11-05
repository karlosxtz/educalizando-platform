// Datas e temas recorrentes no planejamento escolar brasileiro.
// O mesmo catálogo é usado no cadastro do criador e na busca pública.
export const SCHOOL_CALENDAR_TAGS = [
  'Volta às aulas', 'Adaptação escolar', 'Carnaval', 'Dia Internacional da Mulher', 'Dia da Escola',
  'Dia Mundial da Água', 'Dia do Circo', 'Páscoa', 'Dia do Livro Infantil', 'Dia dos Povos Indígenas',
  'Tiradentes', 'Descobrimento do Brasil', 'Dia do Trabalho', 'Dia das Mães', '13 de Maio – Abolição da Escravidão', 'Dia da Família',
  'Combate ao Bullying', 'Meio Ambiente', 'Festa Junina', 'Dia dos Namorados', 'Dia do Orgulho Autista',
  'Dia do Soldado', 'Dia do Folclore', 'Dia do Estudante', 'Dia dos Pais', 'Dia do Psicólogo',
  'Semana da Pátria', 'Independência do Brasil', 'Dia da Árvore', 'Primavera', 'Dia do Trânsito',
  'Dia dos Animais', 'Dia das Crianças', 'Dia dos Professores', 'Dia do Médico', 'Halloween', '31 de outubro – Dia da Reforma Protestante',
  'Setembro Amarelo', 'Outubro Rosa', 'Dia da Consciência Negra', 'Proclamação da República', 'Dia da Bandeira', 'Natal', 'Ano Novo',
  'Formatura', 'Cabelo Maluco', 'Dia do Brinquedo', 'Dia do Amigo', 'Dia dos Avós', 'Dia da Polícia',
  'Educação no Trânsito', 'Educação Financeira', 'Alimentação Saudável', 'Dia da Alimentação Saudável', 'Saúde Bucal', 'Inclusão e Acessibilidade',
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
  'ano-novo': { src: '/images/calendar/mes-01-janeiro.png', alt: 'Ilustração de celebração de Ano Novo' },
  'volta-as-aulas': { src: '/images/calendar/mes-01-janeiro.png', alt: 'Ilustração de volta às aulas e acolhimento escolar' },
  'adaptacao-escolar': { src: '/images/calendar/mes-01-janeiro.png', alt: 'Ilustração de adaptação escolar e acolhimento' },
  'carnaval': { src: '/images/calendar/mes-02-fevereiro.png', alt: 'Ilustração de atividade escolar criativa de carnaval' },
  'dia-internacional-da-mulher': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração educativa de convivência, cuidado e bem-estar' },
  'dia-da-escola': { src: '/images/calendar/leitura.png', alt: 'Ilustração de livros e materiais de planejamento escolar' },
  'dia-mundial-da-agua': { src: '/images/calendar/dia-da-arvore.png', alt: 'Ilustração de crianças cuidando da natureza' },
  'dia-do-circo': { src: '/images/calendar/cultura.png', alt: 'Ilustração lúdica sobre o circo' },
  'combate-ao-bullying': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração sobre respeito e combate ao bullying' },
  'dia-mundial-da-saude': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração educativa de cuidado e bem-estar' },
  'pascoa': { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais de Páscoa e celebração escolar' },
  'dia-do-livro-infantil': { src: '/images/calendar/leitura.png', alt: 'Ilustração de livro infantil e materiais de leitura' },
  'dia-dos-povos-indigenas': { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais culturais e criatividade' },
  'tiradentes': { src: '/images/calendar/cidadania.png', alt: 'Ilustração sobre história do Brasil e Tiradentes' },
  'descobrimento-do-brasil': { src: '/images/calendar/cidadania.png', alt: 'Ilustração de pesquisas históricas do Brasil' },
  'dia-da-terra': { src: '/images/calendar/dia-da-arvore.png', alt: 'Ilustração de crianças cuidando de uma árvore e de mudas' },
  'dia-do-trabalho': { src: '/images/calendar/cidadania.png', alt: 'Ilustração de crianças aprendendo sobre cidadania e comunidade' },
  'dia-das-maes': { src: '/images/calendar/mes-05-maio.png', alt: 'Ilustração de família e homenagem ao Dia das Mães' },
  'abolicao-da-escravidao': { src: '/images/calendar/mes-11-novembro.png', alt: 'Ilustração educativa sobre cultura afro-brasileira, história e diversidade' },
  'dia-da-familia': { src: '/images/calendar/mes-05-maio.png', alt: 'Ilustração de integração com a família na escola' },
  'meio-ambiente': { src: '/images/calendar/dia-da-arvore.png', alt: 'Ilustração de crianças cuidando de uma árvore e de mudas' },
  'dia-dos-namorados': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração comemorativa de afeto e carinho' },
  'dia-do-orgulho-autista': { src: '/images/calendar/cultura.png', alt: 'Ilustração sobre inclusão e neurodiversidade' },
  'festa-junina': { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais culturais e criatividade' },
  'dia-do-amigo': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração sobre amizade e convivência' },
  'dia-dos-avos': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração sobre carinho com os avós' },
  'dia-dos-pais': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração de homenagem ao Dia dos Pais' },
  'dia-do-estudante': { src: '/images/calendar/leitura.png', alt: 'Ilustração de estudantes e aprendizagem' },
  'dia-do-folclore': { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais culturais e criatividade' },
  'dia-do-soldado': { src: '/images/calendar/cidadania.png', alt: 'Ilustração cívica sobre o Dia do Soldado' },
  'dia-do-psicologo': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração sobre saúde mental e cuidado' },
  'setembro-amarelo': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração de valorização da vida e cuidado emocional' },
  'semana-da-patria': { src: '/images/calendar/cidadania.png', alt: 'Ilustração de símbolos cívicos e Semana da Pátria' },
  'independencia-do-brasil': { src: '/images/calendar/cidadania.png', alt: 'Ilustração de crianças aprendendo sobre cidadania e comunidade' },
  'dia-da-arvore': { src: '/images/calendar/dia-da-arvore.png', alt: 'Ilustração de crianças cuidando de uma árvore e de mudas' },
  'primavera': { src: '/images/calendar/dia-da-arvore.png', alt: 'Ilustração da estação da primavera e natureza' },
  'dia-do-transito': { src: '/images/calendar/dia-do-transito.png', alt: 'Ilustração educativa de crianças, faixa de pedestres, ônibus escolar e semáforo' },
  'outubro-rosa': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração sobre saúde e prevenção' },
  'dia-dos-animais': { src: '/images/calendar/dia-da-arvore.png', alt: 'Ilustração de cuidado e respeito aos animais' },
  'dia-das-criancas': { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais culturais e criatividade' },
  'semana-da-crianca': { src: '/images/calendar/cultura.png', alt: 'Ilustração lúdica da Semana da Criança' },
  'dia-dos-professores': { src: '/images/calendar/leitura.png', alt: 'Ilustração de livros e materiais de planejamento escolar' },
  'dia-da-alimentacao-saudavel': { src: '/images/calendar/dia-da-arvore.png', alt: 'Ilustração sobre hábitos alimentares saudáveis' },
  'dia-do-medico': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração de homenagem aos profissionais da saúde' },
  'halloween': { src: '/images/calendar/cultura.png', alt: 'Ilustração lúdica de Halloween' },
  'dia-da-reforma-protestante': { src: '/images/calendar/leitura.png', alt: 'Ilustração sobre história e Reforma Protestante' },
  'proclamacao-da-republica': { src: '/images/calendar/cidadania.png', alt: 'Ilustração de crianças aprendendo sobre cidadania e comunidade' },
  'dia-da-bandeira': { src: '/images/calendar/cidadania.png', alt: 'Ilustração de crianças aprendendo sobre cidadania e comunidade' },
  'dia-da-consciencia-negra': { src: '/images/calendar/bem-estar.png', alt: 'Ilustração educativa de convivência, cuidado e bem-estar' },
  'dia-da-policia': { src: '/images/calendar/cidadania.png', alt: 'Ilustração sobre profissões e segurança' },
  'formatura': { src: '/images/calendar/leitura.png', alt: 'Ilustração de encerramento do ano letivo e formatura' },
  natal: { src: '/images/calendar/cultura.png', alt: 'Ilustração de materiais culturais e criatividade' },
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
  { slug: 'ano-novo', name: 'Ano Novo', month: 1, day: 1, kind: 'data comemorativa', description: 'Celebração de início de ano e atividades de metas e expectativas para o novo ciclo escolar.', searchTerm: 'Ano Novo', icon: 'sparkles', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 5 },
  { slug: 'volta-as-aulas', name: 'Volta às aulas', month: 1, day: 25, kind: 'data pedagógica', description: 'Planejamento de início de ano letivo, recepção dos estudantes e organização da rotina escolar.', searchTerm: 'Volta às aulas', icon: 'book', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 10 },
  { slug: 'adaptacao-escolar', name: 'Adaptação escolar', month: 1, day: 28, kind: 'data pedagógica', description: 'Atividades e dinâmicas de acolhimento e adaptação para novos alunos e turmas da educação infantil e fundamental.', searchTerm: 'Adaptação escolar', icon: 'heart', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 12 },
  { slug: 'carnaval', name: 'Carnaval', month: 2, day: 15, kind: 'cultural', description: 'Tema cultural e festivo para trabalhos com músicas, marchinhas, máscaras e expressões populares.', searchTerm: 'Carnaval', icon: 'palette', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 15 },
  { slug: 'dia-internacional-da-mulher', name: 'Dia Internacional da Mulher', month: 3, day: 8, kind: 'cidadania', description: 'Tema disponível para apoiar planejamentos e propostas pedagógicas relacionadas à data.', searchTerm: 'Dia Internacional da Mulher', icon: 'heart', sourceName: 'Organização das Nações Unidas', sourceUrl: 'https://www.un.org/en/observances/womens-day', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 20 },
  { slug: 'dia-da-escola', name: 'Dia da Escola', month: 3, day: 15, kind: 'data pedagógica', description: 'Tema de planejamento escolar disponível para explorar no catálogo.', searchTerm: 'Dia da Escola', icon: 'calendar', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 30 },
  { slug: 'dia-mundial-da-agua', name: 'Dia Mundial da Água', month: 3, day: 22, kind: 'ambiental', description: 'Tema disponível para localizar materiais e propostas relacionadas à água.', searchTerm: 'Dia Mundial da Água', icon: 'leaf', sourceName: 'Ministério do Meio Ambiente e Mudança do Clima', sourceUrl: 'https://www.gov.br/mma/pt-br/canais_atendimento/atendimento-a-imprensa/datas-comemorativas', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 40 },
  { slug: 'dia-do-circo', name: 'Dia do Circo', month: 3, day: 27, kind: 'cultural', description: 'Homenagem à arte circense, palhaçaria, artes cênicas e expressões corporais no ambiente escolar.', searchTerm: 'Dia do Circo', icon: 'palette', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 45 },
  { slug: 'pascoa', name: 'Páscoa', month: 4, day: 1, kind: 'cultural', description: 'Atividades lúdicas, reflexões sobre renovação e propostas criativas para o período de Páscoa.', searchTerm: 'Páscoa', icon: 'sparkles', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 48 },
  { slug: 'dia-mundial-da-saude', name: 'Dia Mundial da Saúde', month: 4, day: 7, kind: 'saúde e bem-estar', description: 'Tema de planejamento para encontrar materiais voltados ao cuidado e bem-estar.', searchTerm: 'Dia Mundial da Saúde', icon: 'heart', sourceName: 'Organização Mundial da Saúde', sourceUrl: 'https://www.who.int/campaigns/world-health-day', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 50 },
  { slug: 'combate-ao-bullying', name: 'Combate ao Bullying', month: 4, day: 7, kind: 'cidadania', description: 'Dia Nacional de Combate ao Bullying e à Violência na Escola para reflexão sobre respeito e empatia.', searchTerm: 'Combate ao Bullying', icon: 'shield', sourceName: 'Lei nº 13.277/2016', sourceUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13277.htm', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 55 },
  { slug: 'dia-do-livro-infantil', name: 'Dia do Livro Infantil', month: 4, day: 18, kind: 'literatura', description: 'Tema disponível para apoiar propostas de leitura e literatura infantil.', searchTerm: 'Dia do Livro Infantil', icon: 'book', sourceName: 'Lei nº 10.402/2002', sourceUrl: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10402.htm', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 60 },
  { slug: 'dia-dos-povos-indigenas', name: 'Dia dos Povos Indígenas', month: 4, day: 19, kind: 'diversidade e direitos humanos', description: 'Tema disponível para organizar pesquisas e materiais pedagógicos relacionados.', searchTerm: 'Dia dos Povos Indígenas', icon: 'landmark', sourceName: 'Fundação Nacional dos Povos Indígenas', sourceUrl: 'https://www.gov.br/funai/pt-br/assuntos/noticias/2026/abril-indigena-estudantes-de-brasilia-conhecem-a-funai-e-ampliam-olhar-sobre-a-diversidade-dos-povos-indigenas', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 70 },
  { slug: 'tiradentes', name: 'Tiradentes', month: 4, day: 21, kind: 'cidadania', description: 'Reflexões sobre a Inconfidência Mineira, liberdade e marcos da história republicana brasileira.', searchTerm: 'Tiradentes', icon: 'landmark', sourceName: 'Lei nº 4.897/1965', sourceUrl: 'https://www.planalto.gov.br/ccivil_03/leis/1950-1969/l4897.htm', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 75 },
  { slug: 'descobrimento-do-brasil', name: 'Descobrimento do Brasil', month: 4, day: 22, kind: 'cidadania', description: 'Abordagem histórica e reflexiva sobre a chegada dos portugueses e a diversidade original do território.', searchTerm: 'Descobrimento do Brasil', icon: 'landmark', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 78 },
  { slug: 'dia-da-terra', name: 'Dia da Terra', month: 4, day: 22, kind: 'ambiental', description: 'Tema de planejamento para projetos sobre natureza, ambiente e sustentabilidade.', searchTerm: 'Dia da Terra', icon: 'leaf', sourceName: 'Ministério do Meio Ambiente e Mudança do Clima', sourceUrl: 'https://www.gov.br/mma/pt-br/canais_atendimento/atendimento-a-imprensa/datas-comemorativas', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 80 },
  { slug: 'dia-do-trabalho', name: 'Dia do Trabalho', month: 5, day: 1, kind: 'cidadania', description: 'Tema disponível para pesquisas e atividades adequadas ao contexto escolar.', searchTerm: 'Dia do Trabalho', icon: 'landmark', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 90 },
  { slug: 'dia-das-maes', name: 'Dia das Mães', month: 5, day: 10, kind: 'data comemorativa', description: 'Projetos pedagógicos, lembrancinhas e homenagens ao Dia das Mães e figuras de cuidado.', searchTerm: 'Dia das Mães', icon: 'heart', sourceName: 'Decreto nº 21.366/1932', sourceUrl: 'https://www.planalto.gov.br/ccivil_03/decreto/1930-1949/d21366.htm', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 92 },
  { slug: 'abolicao-da-escravidao', name: '13 de Maio – Abolição da Escravidão', month: 5, day: 13, kind: 'diversidade e direitos humanos', description: 'Data para trabalhar criticamente a abolição, seus limites históricos, o protagonismo negro, a resistência e a cultura afro-brasileira.', searchTerm: '13 de Maio – Abolição da Escravidão', icon: 'landmark', sourceName: 'Lei nº 3.353, de 13 de maio de 1888 (Lei Áurea)', sourceUrl: 'https://www.planalto.gov.br/ccivil_03/leis/lim/lim3353.htm', reviewedAt: '2026-10-03', editorialStatus: 'revisado', displayOrder: 95 },
  { slug: 'dia-da-familia', name: 'Dia da Família', month: 5, day: 15, kind: 'cidadania', description: 'Propostas de integração escola-comunidade e valorização dos laços familiares e afetivos.', searchTerm: 'Dia da Família', icon: 'heart', sourceName: 'Organização das Nações Unidas', sourceUrl: 'https://www.un.org/en/observances/family-day', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 98 },
  { slug: 'meio-ambiente', name: 'Meio Ambiente', month: 6, day: 5, kind: 'ambiental', description: 'Tema de planejamento para encontrar recursos sobre cuidado e meio ambiente.', searchTerm: 'Meio Ambiente', icon: 'leaf', sourceName: 'Ministério do Meio Ambiente e Mudança do Clima', sourceUrl: 'https://www.gov.br/mma/pt-br/canais_atendimento/atendimento-a-imprensa/datas-comemorativas', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 100 },
  { slug: 'dia-dos-namorados', name: 'Dia dos Namorados', month: 6, day: 12, kind: 'data comemorativa', description: 'Atividades temáticas sobre afetividade, respeito e vínculos no contexto educacional e cultural.', searchTerm: 'Dia dos Namorados', icon: 'heart', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 105 },
  { slug: 'dia-do-orgulho-autista', name: 'Dia do Orgulho Autista', month: 6, day: 18, kind: 'diversidade e direitos humanos', description: 'Materiais de conscientização, inclusão e valorização da neurodiversidade e direitos dos autistas.', searchTerm: 'Dia do Orgulho Autista', icon: 'heart', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 108 },
  { slug: 'festa-junina', name: 'Festa Junina', month: 6, day: 24, kind: 'cultural', description: 'Tema cultural disponível para localizar materiais de planejamento para o período junino.', searchTerm: 'Festa Junina', icon: 'palette', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 110 },
  { slug: 'dia-do-amigo', name: 'Dia do Amigo', month: 7, day: 20, kind: 'data comemorativa', description: 'Atividades socioemocionais para celebrar amizade, companheirismo e boa convivência.', searchTerm: 'Dia do Amigo', icon: 'heart', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 115 },
  { slug: 'dia-dos-avos', name: 'Dia dos Avós', month: 7, day: 26, kind: 'data comemorativa', description: 'Homenagens afetivas, troca de histórias entre gerações e lembrancinhas para o Dia dos Avós.', searchTerm: 'Dia dos Avós', icon: 'heart', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 118 },
  { slug: 'dia-dos-pais', name: 'Dia dos Pais', month: 8, day: 9, kind: 'data comemorativa', description: 'Planejamento e homenagens ao Dia dos Pais e referências paternas da família.', searchTerm: 'Dia dos Pais', icon: 'heart', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 119 },
  { slug: 'dia-do-estudante', name: 'Dia do Estudante', month: 8, day: 11, kind: 'data pedagógica', description: 'Valorização do protagonismo estudantil, hábitos de estudo e comemorações escolares.', searchTerm: 'Dia do Estudante', icon: 'book', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 120 },
  { slug: 'dia-do-folclore', name: 'Dia do Folclore', month: 8, day: 22, kind: 'cultural', description: 'Tema disponível para descobrir materiais ligados à cultura popular brasileira.', searchTerm: 'Dia do Folclore', icon: 'palette', sourceName: 'Sistema Nacional de Bibliotecas Públicas', sourceUrl: 'https://www.gov.br/cultura/pt-br/assuntos/sistema-nacional-de-bibliotecas-publicas-snbp/publicacoes-2/livros-e-pesquisas/bibliotecapublica_principiosdiretrizes_edicao2.pdf', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 122 },
  { slug: 'dia-do-soldado', name: 'Dia do Soldado', month: 8, day: 25, kind: 'cidadania', description: 'Homenagem cívica em referência ao nascimento do Duque de Caxias, patrono do Exército Brasileiro.', searchTerm: 'Dia do Soldado', icon: 'shield', sourceName: 'Decreto nº 63.364/1968', sourceUrl: 'https://www.planalto.gov.br/ccivil_03/decreto/1950-1969/d63364.htm', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 125 },
  { slug: 'dia-do-psicologo', name: 'Dia do Psicólogo', month: 8, day: 27, kind: 'saúde e bem-estar', description: 'Reconhecimento da psicologia escolar e do apoio ao desenvolvimento emocional e comportamental.', searchTerm: 'Dia do Psicólogo', icon: 'heart', sourceName: 'Lei nº 4.119/1962', sourceUrl: 'https://www.planalto.gov.br/ccivil_03/leis/1950-1969/l4119.htm', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 128 },
  { slug: 'setembro-amarelo', name: 'Setembro Amarelo', month: 9, day: 1, kind: 'campanha informativa', description: 'Campanha de acolhimento emocional, saúde mental e valorização da vida no ambiente escolar.', searchTerm: 'Setembro Amarelo', icon: 'heart', sourceName: 'Associação Brasileira de Psiquiatria', sourceUrl: 'https://www.setembroamarelo.com', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 129 },
  { slug: 'semana-da-patria', name: 'Semana da Pátria', month: 9, day: 1, kind: 'cidadania', description: 'Atividades cívicas, estudo dos símbolos nacionais e história do Brasil.', searchTerm: 'Semana da Pátria', icon: 'landmark', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 130 },
  { slug: 'independencia-do-brasil', name: 'Independência do Brasil', month: 9, day: 7, kind: 'cidadania', description: 'Tema disponível para apoiar pesquisas e atividades escolares relacionadas.', searchTerm: 'Independência do Brasil', icon: 'landmark', sourceName: 'Biblioteca Nacional Digital', sourceUrl: 'https://bndigital.bn.gov.br/dossies/gramaticas-e-dicionarios-do-portugues/linha-do-tempo/sobre-as-efemerides/1822-independencia-do-brasil/', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 132 },
  { slug: 'dia-da-arvore', name: 'Dia da Árvore', month: 9, day: 21, kind: 'ambiental', description: 'Tema disponível para projetos pedagógicos sobre natureza e preservação.', searchTerm: 'Dia da Árvore', icon: 'leaf', sourceName: 'Agência Nacional de Saúde Suplementar', sourceUrl: 'https://www.gov.br/ans/pt-br/arquivos/acesso-a-informacao/transparencia-institucional/planos-de-gestao-de-logistica-sustentavel/relatorio_pls_20172018_semgov.pdf', reviewedAt: '2026-09-23', editorialStatus: 'revisado', displayOrder: 140 },
  { slug: 'primavera', name: 'Primavera', month: 9, day: 22, kind: 'ambiental', description: 'Tema de planejamento para propostas sobre ciclos da natureza, observação e cuidado com o ambiente.', searchTerm: 'Primavera', icon: 'palette', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-26', editorialStatus: 'requer-revisao', displayOrder: 145 },
  { slug: 'dia-do-transito', name: 'Dia do Trânsito', month: 9, day: 25, kind: 'segurança', description: 'Tema de planejamento para materiais sobre convivência e segurança no trânsito.', searchTerm: 'Dia do Trânsito', icon: 'shield', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 150 },
  { slug: 'outubro-rosa', name: 'Outubro Rosa', month: 10, day: 1, kind: 'campanha informativa', description: 'Campanha de conscientização sobre saúde preventiva, autocuidado e bem-estar.', searchTerm: 'Outubro Rosa', icon: 'heart', sourceName: 'Instituto Nacional de Câncer', sourceUrl: 'https://www.inca.gov.br', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 152 },
  { slug: 'dia-dos-animais', name: 'Dia dos Animais', month: 10, day: 4, kind: 'ambiental', description: 'Sensibilização sobre proteção animal, biodiversidade e respeito aos seres vivos.', searchTerm: 'Dia dos Animais', icon: 'leaf', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 155 },
  { slug: 'semana-da-crianca', name: 'Semana da Criança', month: 10, day: 8, kind: 'data pedagógica', description: 'Semana comemorativa com jogos, circuitos motores, oficinas artísticas e gincanas na escola.', searchTerm: 'Semana da Criança', icon: 'sparkles', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 158 },
  { slug: 'dia-das-criancas', name: 'Dia das Crianças', month: 10, day: 12, kind: 'data comemorativa', description: 'Tema disponível para propostas lúdicas e atividades voltadas à infância.', searchTerm: 'Dia das Crianças', icon: 'sparkles', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 160 },
  { slug: 'dia-dos-professores', name: 'Dia dos Professores', month: 10, day: 15, kind: 'data pedagógica', description: 'Tema disponível para reconhecer o trabalho docente em projetos pedagógicos.', searchTerm: 'Dia dos Professores', icon: 'calendar', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 170 },
  { slug: 'dia-da-alimentacao-saudavel', name: 'Dia da Alimentação Saudável', month: 10, day: 16, kind: 'saúde e bem-estar', description: 'Atividades pedagógicas sobre nutrição, consumo consciente e hábitos alimentares saudáveis.', searchTerm: 'Dia da Alimentação Saudável', icon: 'leaf', sourceName: 'Organização das Nações Unidas para a Alimentação e a Agricultura', sourceUrl: 'https://www.fao.org/world-food-day', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 172 },
  { slug: 'dia-do-medico', name: 'Dia do Médico', month: 10, day: 18, kind: 'saúde e bem-estar', description: 'Homenagem aos profissionais de saúde e atividades sobre profissões e cuidados com o corpo.', searchTerm: 'Dia do Médico', icon: 'heart', sourceName: 'Conselho Federal de Medicina', sourceUrl: 'https://portal.cfm.org.br', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 174 },
  { slug: 'halloween', name: 'Halloween', month: 10, day: 31, kind: 'cultural', description: 'Atividades lúdicas sobre o Dia das Bruxas, contos populares, fantasia e criatividade.', searchTerm: 'Halloween', icon: 'palette', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 175 },
  { slug: 'dia-da-reforma-protestante', name: '31 de outubro – Dia da Reforma Protestante', month: 10, day: 31, kind: 'data comemorativa', description: 'Tema disponível para materiais educativos sobre a Reforma Protestante, sua história e seus impactos culturais e religiosos.', searchTerm: '31 de outubro – Dia da Reforma Protestante', icon: 'book', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-10-08', editorialStatus: 'requer-revisao', displayOrder: 176 },
  { slug: 'proclamacao-da-republica', name: 'Proclamação da República', month: 11, day: 15, kind: 'cidadania', description: 'Tema disponível para pesquisas e propostas pedagógicas relacionadas à história do Brasil.', searchTerm: 'Proclamação da República', icon: 'landmark', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 180 },
  { slug: 'dia-da-bandeira', name: 'Dia da Bandeira', month: 11, day: 19, kind: 'cidadania', description: 'Tema disponível para organizar pesquisas e materiais relacionados a símbolos nacionais.', searchTerm: 'Dia da Bandeira', icon: 'landmark', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 190 },
  { slug: 'dia-da-consciencia-negra', name: 'Dia da Consciência Negra', month: 11, day: 20, kind: 'diversidade e direitos humanos', description: 'Tema disponível para encontrar materiais relacionados à educação e cultura afro-brasileira.', searchTerm: 'Dia da Consciência Negra', icon: 'heart', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 200 },
  { slug: 'dia-da-policia', name: 'Dia da Polícia', month: 12, day: 3, kind: 'cidadania', description: 'Atividades sobre profissões, serviços públicos, segurança e cidadania.', searchTerm: 'Dia da Polícia', icon: 'shield', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 205 },
  { slug: 'formatura', name: 'Formatura', month: 12, day: 10, kind: 'data pedagógica', description: 'Materiais de encerramento do ano letivo, formaturas, lembrancinhas e retrospectivas de aprendizagem.', searchTerm: 'Formatura', icon: 'book', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-11-04', editorialStatus: 'revisado', displayOrder: 208 },
  { slug: 'natal', name: 'Natal', month: 12, day: 25, kind: 'cultural', description: 'Tema disponível para planejamentos e materiais de encerramento do ano.', searchTerm: 'Natal', icon: 'sparkles', sourceName: 'Catálogo editorial Educalizando', reviewedAt: '2026-09-23', editorialStatus: 'requer-revisao', displayOrder: 210 },
];

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
  0: ['Ano Novo', 'Volta às aulas', 'Adaptação escolar', 'Formatura'],
  1: ['Carnaval', 'Volta às aulas', 'Adaptação escolar', 'Combate ao Bullying'],
  2: ['Dia Internacional da Mulher', 'Dia da Escola', 'Dia Mundial da Água', 'Dia do Circo', 'Projeto de Ciências'],
  3: ['Páscoa', 'Dia Mundial da Saúde', 'Combate ao Bullying', 'Dia do Livro Infantil', 'Dia dos Povos Indígenas', 'Tiradentes', 'Descobrimento do Brasil', 'Dia da Terra', 'Projeto de Leitura'],
  4: ['Dia do Trabalho', 'Dia das Mães', '13 de Maio – Abolição da Escravidão', 'Dia da Família', 'Cultura Afro-Brasileira'],
  5: ['Meio Ambiente', 'Dia dos Namorados', 'Dia do Orgulho Autista', 'Festa Junina', 'Alimentação Saudável'],
  6: ['Festa Junina', 'Dia do Amigo', 'Dia dos Avós', 'Educação Financeira', 'Inclusão e Acessibilidade'],
  7: ['Dia dos Pais', 'Dia do Estudante', 'Dia do Folclore', 'Dia do Soldado', 'Dia do Psicólogo'],
  8: ['Setembro Amarelo', 'Semana da Pátria', 'Independência do Brasil', 'Dia da Árvore', 'Primavera', 'Dia do Trânsito', 'Educação no Trânsito'],
  9: ['Outubro Rosa', 'Dia dos Animais', 'Semana da Criança', 'Dia das Crianças', 'Dia dos Professores', 'Dia da Alimentação Saudável', 'Dia do Médico', 'Halloween', '31 de outubro – Dia da Reforma Protestante', 'Cabelo Maluco', 'Dia do Brinquedo'],
  10: ['Proclamação da República', 'Dia da Bandeira', 'Dia da Consciência Negra', 'Cultura Afro-Brasileira', 'Cultura Indígena', 'Saúde Bucal'],
  11: ['Dia da Polícia', 'Formatura', 'Natal', 'Ano Novo'],
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
  { tag: 'Ano Novo', month: 1, day: 1 },
  { tag: 'Volta às aulas', month: 1, day: 25 },
  { tag: 'Adaptação escolar', month: 1, day: 28 },
  { tag: 'Carnaval', month: 2, day: 15 },
  { tag: 'Dia Internacional da Mulher', month: 3, day: 8 },
  { tag: 'Dia da Escola', month: 3, day: 15 },
  { tag: 'Dia Mundial da Água', month: 3, day: 22 },
  { tag: 'Dia do Circo', month: 3, day: 27 },
  { tag: 'Páscoa', month: 4, day: 1 },
  { tag: 'Dia Mundial da Saúde', month: 4, day: 7 },
  { tag: 'Combate ao Bullying', month: 4, day: 7 },
  { tag: 'Dia do Livro Infantil', month: 4, day: 18 },
  { tag: 'Dia dos Povos Indígenas', month: 4, day: 19 },
  { tag: 'Tiradentes', month: 4, day: 21 },
  { tag: 'Descobrimento do Brasil', month: 4, day: 22 },
  { tag: 'Dia da Terra', month: 4, day: 22 },
  { tag: 'Dia do Trabalho', month: 5, day: 1 },
  { tag: 'Dia das Mães', month: 5, day: 10 },
  { tag: '13 de Maio – Abolição da Escravidão', month: 5, day: 13 },
  { tag: 'Dia da Família', month: 5, day: 15 },
  { tag: 'Meio Ambiente', month: 6, day: 5 },
  { tag: 'Dia dos Namorados', month: 6, day: 12 },
  { tag: 'Dia do Orgulho Autista', month: 6, day: 18 },
  { tag: 'Festa Junina', month: 6, day: 24 },
  { tag: 'Dia do Amigo', month: 7, day: 20 },
  { tag: 'Dia dos Avós', month: 7, day: 26 },
  { tag: 'Dia dos Pais', month: 8, day: 9 },
  { tag: 'Dia do Estudante', month: 8, day: 11 },
  { tag: 'Dia do Folclore', month: 8, day: 22 },
  { tag: 'Dia do Soldado', month: 8, day: 25 },
  { tag: 'Dia do Psicólogo', month: 8, day: 27 },
  { tag: 'Setembro Amarelo', month: 9, day: 1 },
  { tag: 'Semana da Pátria', month: 9, day: 1 },
  { tag: 'Independência do Brasil', month: 9, day: 7 },
  { tag: 'Dia da Árvore', month: 9, day: 21 },
  { tag: 'Primavera', month: 9, day: 22 },
  { tag: 'Dia do Trânsito', month: 9, day: 25 },
  { tag: 'Outubro Rosa', month: 10, day: 1 },
  { tag: 'Dia dos Animais', month: 10, day: 4 },
  { tag: 'Semana da Criança', month: 10, day: 8 },
  { tag: 'Dia das Crianças', month: 10, day: 12 },
  { tag: 'Dia dos Professores', month: 10, day: 15 },
  { tag: 'Dia da Alimentação Saudável', month: 10, day: 16 },
  { tag: 'Dia do Médico', month: 10, day: 18 },
  { tag: 'Halloween', month: 10, day: 31 },
  { tag: '31 de outubro – Dia da Reforma Protestante', month: 10, day: 31 },
  { tag: 'Proclamação da República', month: 11, day: 15 },
  { tag: 'Dia da Bandeira', month: 11, day: 19 },
  { tag: 'Dia da Consciência Negra', month: 11, day: 20 },
  { tag: 'Dia da Polícia', month: 12, day: 3 },
  { tag: 'Formatura', month: 12, day: 10 },
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
