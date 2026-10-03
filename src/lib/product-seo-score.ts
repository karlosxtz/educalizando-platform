export type SeoScorableProduct = {
  titulo?: string | null;
  descricao?: string | null;
  capa_url?: string | null;
  category_id?: string | null;
  education_level_id?: string | null;
  tags?: string[] | null;
  slug?: string | null;
};

export function calculateProductSeoScore(product: SeoScorableProduct) {
  const titleLength = product.titulo?.trim().length || 0;
  const descriptionLength = product.descricao?.trim().length || 0;
  const checks = [
    { ok: titleLength >= 30 && titleLength <= 65, issue: 'Ajustar o título para ficar claro e ter entre 30 e 65 caracteres.' },
    { ok: descriptionLength >= 120, issue: 'Completar a descrição com benefícios, conteúdo incluso e público indicado.' },
    { ok: Boolean(product.capa_url), issue: 'Adicionar uma capa para melhorar a apresentação do material.' },
    { ok: Boolean(product.category_id), issue: 'Definir a categoria para facilitar que o material seja encontrado.' },
    { ok: Boolean(product.education_level_id), issue: 'Definir o nível de ensino do material.' },
    { ok: Boolean(product.tags?.filter(Boolean).length), issue: 'Adicionar tags de busca específicas para o conteúdo.' },
    { ok: Boolean(product.slug), issue: 'Gerar o endereço público amigável do produto.' },
  ];
  const issues = checks.filter(check => !check.ok).map(check => check.issue);
  return { score: Math.round((checks.filter(check => check.ok).length / checks.length) * 100), issues };
}
