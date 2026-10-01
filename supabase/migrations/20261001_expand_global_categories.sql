-- Amplia a taxonomia global para os principais nichos pedagógicos e religiosos.
-- A comparação por slug torna a migração idempotente mesmo sem constraint única
-- para categorias globais.

with desired_categories(nome, slug) as (
  values
    ('Ministério Infantil', 'ministerio-infantil'),
    ('Religioso', 'religioso'),
    ('Português e Literatura', 'portugues-literatura'),
    ('Redação e Produção Textual', 'redacao-producao-textual'),
    ('Física e Química', 'fisica-quimica'),
    ('Tecnologia e Informática', 'tecnologia-informatica'),
    ('Robótica e Programação', 'robotica-programacao'),
    ('Educação Socioemocional', 'educacao-socioemocional'),
    ('Educação Física', 'educacao-fisica'),
    ('Meio Ambiente e Sustentabilidade', 'meio-ambiente-sustentabilidade'),
    ('Psicopedagogia', 'psicopedagogia'),
    ('Inclusão e Acessibilidade', 'inclusao-acessibilidade'),
    ('Planos de Aula', 'planos-de-aula'),
    ('Projetos e Sequências Didáticas', 'projetos-sequencias-didaticas'),
    ('Avaliações e Simulados', 'avaliacoes-simulados'),
    ('Atividades Lúdicas', 'atividades-ludicas'),
    ('Coordenação Motora', 'coordenacao-motora'),
    ('Caligrafia', 'caligrafia'),
    ('Raciocínio Lógico', 'raciocinio-logico'),
    ('Gestão Escolar', 'gestao-escolar'),
    ('Formação de Professores', 'formacao-de-professores'),
    ('Educação de Jovens e Adultos (EJA)', 'eja'),
    ('BNCC', 'bncc'),
    ('Catequese', 'catequese'),
    ('Escola Bíblica Dominical', 'escola-biblica-dominical'),
    ('Bíblia e Histórias Bíblicas', 'biblia-historias-biblicas')
)
insert into public.categories (id, nome, slug, store_id, created_at)
select gen_random_uuid(), desired.nome, desired.slug, null, now()
from desired_categories desired
where not exists (
  select 1
  from public.categories existing
  where existing.store_id is null
    and lower(existing.slug) = lower(desired.slug)
);
