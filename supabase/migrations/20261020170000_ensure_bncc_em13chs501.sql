-- Garante a habilidade solicitada sem trocar o ID nem os vínculos dos produtos.
INSERT INTO public.bncc_skills (code, slug, description, grade_level, subject)
VALUES (
  'EM13CHS501',
  'em13chs501',
  'Analisar os fundamentos da ética em diferentes culturas, tempos e espaços, identificando processos que contribuem para a formação de sujeitos éticos que valorizem a liberdade, a cooperação, a autonomia, o empreendedorismo, a convivência democrática e a solidariedade.',
  'Ensino Médio',
  'Ciências Humanas e Sociais Aplicadas'
)
ON CONFLICT (code) DO UPDATE SET
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  grade_level = EXCLUDED.grade_level,
  subject = EXCLUDED.subject;

SELECT code, description, grade_level, subject
FROM public.bncc_skills
WHERE code = 'EM13CHS501';
