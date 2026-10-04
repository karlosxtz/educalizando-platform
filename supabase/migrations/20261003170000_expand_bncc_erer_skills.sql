-- Amplia a descoberta de materiais ligados à Educação para as Relações
-- Étnico-Raciais (ERER), preservando a redação das habilidades oficiais.
-- EF05HI20 é identificado como referência curricular preliminar para não ser
-- apresentado incorretamente como código da versão final vigente da BNCC.

insert into public.bncc_skills (code, slug, description, grade_level, subject)
values
  ('EF05HI20', 'ef05hi20', 'Referência curricular complementar (versão preliminar, não integrante da BNCC final vigente): comparar formas de vida dos primeiros grupos humanos com as primeiras civilizações. Pode apoiar abordagens contextualizadas sobre sociedades e civilizações africanas.', '5º ano do Ensino Fundamental', 'História — referência complementar'),
  ('EF06HI19', 'ef06hi19', 'Descrever e analisar os diferentes papéis sociais das mulheres no mundo antigo e nas sociedades medievais. Articulação ERER: permite abordar o protagonismo de mulheres em sociedades africanas antigas e medievais.', '6º ano do Ensino Fundamental', 'História'),
  ('EF69AR01', 'ef69ar01', 'Pesquisar, apreciar e analisar formas distintas das artes visuais tradicionais e contemporâneas, em obras de artistas brasileiros e estrangeiros de diferentes épocas e em diferentes matrizes estéticas e culturais, de modo a ampliar a experiência com diferentes contextos e práticas artístico-visuais e cultivar a percepção, o imaginário, a capacidade de simbolizar e o repertório imagético. Articulação ERER: incluir produções africanas, afro-brasileiras, indígenas e quilombolas.', '6º ao 9º ano do Ensino Fundamental', 'Arte'),
  ('EF69AR13', 'ef69ar13', 'Investigar brincadeiras, jogos, danças coletivas e outras práticas de dança de diferentes matrizes estéticas e culturais como referência para criações autorais. Articulação ERER: valorizar práticas africanas, afro-brasileiras e indígenas sem estereótipos.', '6º ao 9º ano do Ensino Fundamental', 'Arte'),
  ('EF69AR15', 'ef69ar15', 'Discutir experiências pessoais e coletivas em dança vivenciadas na escola e em outros contextos, problematizando estereótipos e preconceitos. Articulação ERER: reconhecer e enfrentar preconceitos étnico-raciais nas práticas corporais e artísticas.', '6º ao 9º ano do Ensino Fundamental', 'Arte'),
  ('EF69AR33', 'ef69ar33', 'Analisar aspectos históricos, sociais e políticos da produção artística, problematizando narrativas eurocêntricas e categorizações da arte. Articulação ERER: reconhecer autorias, referências e perspectivas africanas, afro-brasileiras, indígenas e quilombolas.', '6º ao 9º ano do Ensino Fundamental', 'Arte'),
  ('EF69AR34', 'ef69ar34', 'Analisar e valorizar o patrimônio cultural, material e imaterial, de culturas diversas, em especial a brasileira, incluindo suas matrizes indígenas, africanas e europeias, de diferentes épocas, e favorecendo a construção de vocabulário e repertório relativos às diferentes linguagens artísticas. Articulação ERER: promover educação antirracista e valorização das culturas afro-brasileiras, africanas e indígenas.', '6º ao 9º ano do Ensino Fundamental', 'Arte'),
  ('ERER01', 'erer01', 'Reconhecer e valorizar a história e a cultura afro-brasileira, africana e indígena, seus saberes, memórias, identidades e contribuições para a formação da sociedade brasileira.', 'Educação Infantil ao Ensino Médio', 'Educação para as Relações Étnico-Raciais'),
  ('ERER02', 'erer02', 'Analisar criticamente o racismo, os preconceitos e as desigualdades étnico-raciais, promovendo respeito, equidade, direitos humanos e práticas antirracistas.', 'Ensino Fundamental e Ensino Médio', 'Educação para as Relações Étnico-Raciais'),
  ('ERER03', 'erer03', 'Conhecer formas de resistência, protagonismo e produção cultural de povos africanos, afro-brasileiros, indígenas e comunidades quilombolas em diferentes tempos e territórios.', 'Ensino Fundamental e Ensino Médio', 'Educação para as Relações Étnico-Raciais'),
  ('ERER04', 'erer04', 'Valorizar patrimônios materiais e imateriais, expressões artísticas, religiosidades, oralidades e tradições de matrizes africanas, afro-brasileiras e indígenas.', 'Educação Infantil ao Ensino Médio', 'Educação para as Relações Étnico-Raciais'),
  ('ERER05', 'erer05', 'Identificar representações estereotipadas e produzir narrativas que respeitem a diversidade étnico-racial e ampliem a presença de diferentes sujeitos e perspectivas.', 'Ensino Fundamental e Ensino Médio', 'Educação para as Relações Étnico-Raciais'),
  ('ERER06', 'erer06', 'Relacionar a abolição da escravidão aos processos de resistência negra, ao pós-abolição, à cidadania e às permanências das desigualdades raciais no Brasil.', 'Ensino Fundamental e Ensino Médio', 'Educação para as Relações Étnico-Raciais')
on conflict (code) do update set
  slug = excluded.slug,
  description = excluded.description,
  grade_level = excluded.grade_level,
  subject = excluded.subject;

