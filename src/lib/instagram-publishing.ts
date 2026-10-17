import 'server-only';
import { supabaseAdmin as db } from './supabase';
import { createUploadUrl, headObject, resolveBucket, uploadCacheControl } from './object-storage';
import { publicImageObjectUrl } from './public-image-url';
import { isInstagramUuid, type InstagramTarget, type InstagramPostStatus } from './instagram-contract';
import { InstagramInputError, readInstagramConnection, usableInstagramToken } from './instagram-store';
import { createInstagramContainer, instagramContainerStatus, publishInstagramContainer } from './instagram-provider';
import { instagramBrandedCaption } from './instagram-design';

type Post = { id: string; store_id: string; connection_id: string | null; product_id: string | null; target: InstagramTarget; caption: string; image_key: string; image_url: string; image_size: number; status: InstagramPostStatus; container_id: string | null; media_id: string | null; error_message: string | null; updated_at: string };
export const safeInstagramPost = (post: Post) => ({ id: post.id, target: post.target, status: post.status, media_id: post.media_id, error_message: post.error_message });
async function postById(storeId: string, id: string): Promise<Post> {
  const { data, error } = await db.from('creator_instagram_posts').select('*').eq('id', id).eq('store_id', storeId).maybeSingle();
  if (error) throw error; if (!data) throw new InstagramInputError('Publicação não encontrada.', 404);
  return data;
}
async function transition(post: Post, status: InstagramPostStatus, patch: Record<string, unknown> = {}): Promise<Post | null> {
  const { data, error } = await db.from('creator_instagram_posts').update({ ...patch, status, updated_at: new Date().toISOString() }).eq('id', post.id).eq('store_id', post.store_id).eq('status', post.status).eq('updated_at', post.updated_at).select('*').maybeSingle();
  if (error) throw error; return data;
}
export async function prepareInstagramPost(storeId: string, input: Record<string, unknown>) {
  if (!isInstagramUuid(input.id) || !isInstagramUuid(input.productId) || !['story', 'feed'].includes(String(input.target)) || typeof input.caption !== 'string' || input.caption.length > 2200 || !Number.isInteger(input.size) || Number(input.size) < 1 || Number(input.size) > 8000000) throw new InstagramInputError('Confira o produto, o formato e a arte JPEG de até 8 MB.');
  if (input.target === 'feed') {
    input = { ...input, caption: instagramBrandedCaption(input.caption) };
    if (String(input.caption).length > 2200) throw new InstagramInputError('Encurte a legenda para incluir a menção à Educalizando dentro de 2.200 caracteres.');
  }
  const connection = await readInstagramConnection(storeId);
  if (!connection) throw new InstagramInputError('Conecte o Instagram da sua loja antes de publicar.', 409);
  if (input.target === 'story' && connection.account_type !== 'BUSINESS') throw new InstagramInputError('Para publicar Stories nesta integração, conecte uma conta profissional do tipo Empresa.', 409);
  await usableInstagramToken(connection);
  const { data: product, error } = await db.from('products').select('id,updated_at').eq('id', input.productId).eq('store_id', storeId).in('status', ['publicado', 'ativo', 'published']).is('excluido_em', null).maybeSingle();
  if (error) throw error; if (!product) throw new InstagramInputError('Selecione um produto publicado da sua loja.', 404);
  if ((product.updated_at || null) !== (input.expectedUpdatedAt || null)) throw new InstagramInputError('O produto foi atualizado. Recarregue os dados e gere a arte novamente.', 409);
  const bucket = resolveBucket('product-covers'), key = `uploads/${storeId}/instagram/${input.id}.jpg`;
  const imageUrl = publicImageObjectUrl(bucket, key); if (!imageUrl) throw new InstagramInputError('O armazenamento das artes precisa ser configurado pela Educalizando.', 503);
  const { data: previous, error: previousError } = await db.from('creator_instagram_posts').select('*').eq('id', input.id).eq('store_id', storeId).maybeSingle();
  if (previousError) throw previousError;
  let post: Post = previous;
  if (post && (post.product_id !== input.productId || post.target !== input.target || post.caption !== input.caption || post.image_size !== input.size || post.connection_id !== connection.id)) throw new InstagramInputError('Esta solicitação já foi usada. Gere uma nova arte.', 409);
  if (!post) {
    const { data, error: insertError } = await db.from('creator_instagram_posts').insert({ id: input.id, store_id: storeId, connection_id: connection.id, product_id: product.id, target: input.target, caption: input.caption, image_key: key, image_url: imageUrl, image_size: input.size }).select('*').single();
    if (insertError) {
      if (insertError.code === '23505') throw new InstagramInputError('Solicitação já recebida. Consulte o histórico antes de repetir.', 409);
      throw insertError;
    }
    post = data;
  }
  if (post.status !== 'awaiting_upload') return { post: safeInstagramPost(post) };
  return { post: safeInstagramPost(post), uploadUrl: await createUploadUrl({ bucket, key: post.image_key, contentType: 'image/jpeg', size: post.image_size }), uploadHeaders: { 'Content-Type': 'image/jpeg', 'Cache-Control': uploadCacheControl(bucket) } };
}
/** No sleeps, automatic retries or duplicate publish calls after uncertain outcomes. */
export async function advanceInstagramPost(storeId: string, id: string, publish: boolean) {
  let post = await postById(storeId, id);
  if (post.status === 'published' || post.status === 'failed') return safeInstagramPost(post);
  if (!post.connection_id) throw new InstagramInputError('A conta foi desconectada. Prepare uma nova publicação após conectar novamente.', 409);
  const connection = await readInstagramConnection(storeId, post.connection_id);
  if (!connection) throw new InstagramInputError('A conexão mudou. Prepare uma nova publicação.', 409);
  const token = await usableInstagramToken(connection);
  if (post.status === 'creating') {
    if (Date.now() - Date.parse(post.updated_at) > 60000) post = await transition(post, 'failed', { error_message: 'O preparo foi interrompido antes da publicação. Gere uma nova arte para tentar novamente.' }) || await postById(storeId, id);
    return safeInstagramPost(post);
  }
  if (['publishing', 'uncertain'].includes(post.status)) {
    if (post.container_id && await instagramContainerStatus(post.container_id, token) === 'PUBLISHED') {
      post = await transition(post, 'published', { error_message: null }) || await postById(storeId, id);
    } else if (post.status === 'publishing' && Date.now() - Date.parse(post.updated_at) > 30000) {
      post = await transition(post, 'uncertain', { error_message: 'O envio ocorreu, mas falta confirmar o resultado. Confira seu Instagram antes de criar outra publicação.' }) || await postById(storeId, id);
    }
    return safeInstagramPost(post);
  }
  if (!publish) return safeInstagramPost(post);
  const { data: product, error: productError } = await db.from('products').select('id').eq('id', post.product_id).eq('store_id', storeId).in('status', ['publicado', 'ativo', 'published']).is('excluido_em', null).maybeSingle();
  if (productError) throw productError; if (!product) throw new InstagramInputError('O produto não está mais publicado nesta loja.', 409);
  if (post.status === 'awaiting_upload') {
    let object;
    try { object = await headObject(resolveBucket('product-covers'), post.image_key); }
    catch { throw new InstagramInputError('O envio da arte ainda não terminou. Aguarde e tente concluir novamente.', 409); }
    if (object.ContentType !== 'image/jpeg' || object.ContentLength !== post.image_size) throw new InstagramInputError('A arte enviada não corresponde ao JPEG preparado. Gere novamente.');
    const claimed = await transition(post, 'creating');
    if (!claimed) return safeInstagramPost(await postById(storeId, id));
    try {
      const container = await createInstagramContainer(connection.instagram_user_id, token, claimed.image_url, claimed.target, claimed.caption);
      post = await transition(claimed, 'processing', { container_id: container }) || await postById(storeId, id);
    } catch {
      post = await transition(claimed, 'failed', { error_message: 'Não foi possível preparar a imagem no Instagram. Confira a conexão, as permissões e a arte antes de gerar outra publicação.' }) || await postById(storeId, id);
    }
    return safeInstagramPost(post);
  }
  if (post.status === 'processing' && post.container_id) {
    const status = await instagramContainerStatus(post.container_id, token);
    if (status === 'PUBLISHED') return safeInstagramPost(await transition(post, 'published') || await postById(storeId, id));
    if (status === 'ERROR' || status === 'EXPIRED') return safeInstagramPost(await transition(post, 'failed', { error_message: 'O Instagram não aceitou a imagem ou o preparo expirou. Gere uma nova arte.' }) || await postById(storeId, id));
    if (status !== 'FINISHED') return safeInstagramPost(post);
    const claimed = await transition(post, 'publishing');
    if (!claimed) return safeInstagramPost(await postById(storeId, id));
    try {
      const mediaId = await publishInstagramContainer(connection.instagram_user_id, post.container_id, token);
      post = await transition(claimed, 'published', { media_id: mediaId, error_message: null }) || await postById(storeId, id);
    } catch {
      post = await transition(claimed, 'uncertain', { error_message: 'O Instagram não confirmou o resultado do envio. Consulte a situação e confira sua conta antes de publicar novamente.' }) || await postById(storeId, id);
    }
  }
  return safeInstagramPost(post);
}
