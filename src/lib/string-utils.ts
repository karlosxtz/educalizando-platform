/**
 * Normaliza uma string para ser usada como URL slug.
 * Remove acentos, caracteres especiais, e converte para minúsculas.
 * Caso o slug final seja vazio, gera um fallback seguro (aleatório curto).
 */
export function generateSlug(text: string | null | undefined): string {
  if (!text) {
    return `produto-${Math.random().toString(36).substring(2, 8)}`;
  }

  const slug = text
    .toString()
    .normalize('NFD') // Separa os caracteres de seus diacríticos (acentos)
    .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // Remove qualquer coisa que não seja letra, número, espaço ou hífen
    .replace(/\s+/g, '-') // Substitui espaços por hifens
    .replace(/-+/g, '-'); // Remove múltiplos hifens consecutivos

  if (!slug || slug === '-') {
    return `produto-${Math.random().toString(36).substring(2, 8)}`;
  }

  // Gera um sufixo curto para evitar colisões de produtos com o mesmo nome
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${randomSuffix}`;
}
