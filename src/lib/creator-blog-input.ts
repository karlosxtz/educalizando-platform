export const BLOG_TOPICS = ['Dicas pedagógicas', 'Planejamento', 'Alfabetização', 'Educação Infantil', 'Jogos e atividades', 'Inclusão', 'Experiências em sala', 'Para criadores'] as const;
export const BLOG_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function creatorBlogInput(input: Record<string, unknown>) {
  const text = (key: string) => typeof input[key] === 'string' ? input[key].trim() : '';
  const title = text('title'), excerpt = text('excerpt'), content = text('content');
  const topic = text('topic') || BLOG_TOPICS[0];
  if (!['draft','published'].includes(String(input.status))) throw new Error('Escolha rascunho ou publicado.');
  if (title.length < 8 || title.length > 180) throw new Error('O título precisa ter entre 8 e 180 caracteres.');
  if (excerpt.length < 40 || excerpt.length > 360) throw new Error('O resumo precisa ter entre 40 e 360 caracteres.');
  if (content.length < (input.status === 'published' ? 200 : 20) || content.length > 30000) throw new Error('Escreva pelo menos 200 caracteres para publicar (20 para rascunho), até 30 mil caracteres.');
  if (!(BLOG_TOPICS as readonly string[]).includes(topic)) throw new Error('Escolha um dos temas disponíveis.');
  const cover_url = text('cover_url');
  if (cover_url) {
    let valid = false;
    try { const url = new URL(cover_url); valid = url.protocol === 'https:' && url.hostname === 'arquivos.educalizando.com.br' && url.pathname.startsWith('/public-images/') && !url.username && !url.password && !url.port && !url.search && !url.hash; } catch { /* Reject arbitrary references. */ }
    if (!valid || cover_url.length > 2000) throw new Error('Envie a capa pelo botão de imagem do editor.');
  }
  return { title, excerpt, content, topic, cover_url: cover_url || null, status: input.status as 'draft' | 'published' };
}
export function creatorBlogSlug(title: string, id: string) {
  const base = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90).replace(/-$/,'');
  return (base || 'artigo') + '-' + id.replace(/-/g,'');
}
