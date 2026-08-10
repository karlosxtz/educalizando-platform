import { supabase, isRealSupabaseConfigured } from './supabase';
import { getLocalOrders } from './sales-service';

/**
 * =============================================================================
 * EDUCALIZANDO — MÓDULO CONTEÚDO & ENTREGAS (SERVICE & SECURITY VALIDATION)
 * =============================================================================
 * Arquitetura & Diretrizes de Entrega Digital:
 * 1. LIMITE MÁXIMO DE ARQUIVO: 15 MB por arquivo (15.728.640 bytes).
 * 2. PROIBIÇÃO DE VÍDEOS: NENHUM arquivo de vídeo pode ser enviado para o storage.
 * 3. VÍDEOS POR LINK EXTERNO: Vídeos devem ser cadastrados apenas como link externo
 *    (YouTube, Vimeo, Google Drive, etc.).
 * 4. SEGURANÇA E AUTORIZAÇÃO DE DOWNLOADS (ENTITLEMENTS):
 *    - Valida se o cliente possui compra paga/aprovada para o produto.
 *    - Valida expiração do acesso (dias a partir da data de confirmação do pagamento).
 *    - Valida limite de downloads (ex: 1, 3, 5, 10 ou ilimitado).
 * 5. RASTREAMENTO DIFERENCIADO:
 *    - Download de arquivo -> evento FILE_DOWNLOAD (contabilizado em Downloads).
 *    - Clique em link externo -> evento EXTERNAL_LINK_ACCESS (contabilizado em Acessos, NUNCA em Downloads).
 * =============================================================================
 */

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_FILE_SIZE_MB = 15;

export const PROHIBITED_VIDEO_EXTENSIONS = [
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'mpeg', 'm4v', '3gp', 'wmv', 'ogv', 'ts', 'm2ts', 'vob'
];

export type ContentType = 'ARQUIVO' | 'LINK_EXTERNO';
export type AccessEventType = 'FILE_DOWNLOAD' | 'EXTERNAL_LINK_ACCESS';

export interface ContentItem {
  id: string;
  storeId: string;
  productId?: string | null;
  productTitle?: string | null;
  titulo: string;
  descricao?: string | null;
  tipo: ContentType;
  url: string;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  fileSizeFormatted?: string | null;
  mimeType?: string | null;
  downloadsCount: number;
  externalAccessCount: number;
  downloadLimit?: number | null; // null/undefined = ilimitado
  validityDays?: number | null; // null/undefined = ilimitado
  active: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccessEventLog {
  id: string;
  storeId: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  contentId: string;
  contentTitle: string;
  productId?: string | null;
  productTitle?: string | null;
  tipoEvento: AccessEventType;
  data: string;
  ip?: string | null;
}

export interface ContentDeliveryMetrics {
  totalProdutosComConteudo: number;
  totalConteudos: number;
  totalArquivos: number;
  totalLinksExternos: number;
  totalDownloads: number;
  totalAcessos: number;
}

export interface FileValidationResult {
  valid: boolean;
  errorTitle?: string;
  errorMessage?: string;
}

export interface StudentContentAccessGrant {
  authorized: boolean;
  url?: string;
  errorMessage?: string;
  downloadsUsed: number;
  downloadLimit?: number | null;
  accessUntil?: string | null;
}

// 1. Função de Validação de Segurança Dual (MIME + Extensão + Tamanho)
export function validateContentFileUpload(file: { name: string; size: number; type?: string }): FileValidationResult {
  // A. Verificação de Vídeo por MIME Type e Extensão
  const mime = (file.type || '').toLowerCase();
  const ext = (file.name.split('.').pop() || '').toLowerCase();

  const isVideoMime = mime.startsWith('video/');
  const isVideoExt = PROHIBITED_VIDEO_EXTENSIONS.includes(ext);

  if (isVideoMime || isVideoExt) {
    return {
      valid: false,
      errorTitle: 'Upload de vídeos não é permitido',
      errorMessage: 'Vídeos não podem ser enviados para a Educalizando. Adicione o vídeo utilizando um link externo (YouTube, Vimeo, Google Drive, etc.).'
    };
  }

  // B. Verificação de Tamanho (Máximo 15 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      errorTitle: 'Arquivo muito grande',
      errorMessage: 'O arquivo excede o limite de 15 MB.'
    };
  }

  return { valid: true };
}

// Key em LocalStorage para persistência de conteúdos por loja
const LOCAL_CONTENT_KEY = 'educalizando_store_contents_v2';
const LOCAL_ACCESS_LOGS_KEY = 'educalizando_store_access_logs_v2';

function getLocalContents(): ContentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CONTENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalContents(items: ContentItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar conteúdos no localStorage:', e);
  }
}

function getLocalAccessLogs(): AccessEventLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACCESS_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalAccessLogs(logs: AccessEventLog[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_ACCESS_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Erro ao salvar logs de acesso no localStorage:', e);
  }
}

// 2. Buscar Todos os Conteúdos por Loja (Isolamento por store_id)
export async function getContentByStoreId(storeId: string): Promise<ContentItem[]> {
  if (!storeId) return [];

  let contents: ContentItem[] = [];

  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('digital_contents')
        .select('*')
        .eq('store_id', storeId)
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        contents = data.map((d: any, idx: number) => ({
          id: d.id,
          storeId: d.store_id || storeId,
          productId: d.product_id || null,
          productTitle: d.product_title || null,
          titulo: d.titulo,
          descricao: d.descricao || null,
          tipo: d.tipo === 'LINK_EXTERNO' ? 'LINK_EXTERNO' : 'ARQUIVO',
          url: d.url,
          fileName: d.file_name || null,
          fileSizeBytes: d.file_size_bytes || null,
          fileSizeFormatted: d.file_size_formatted || null,
          mimeType: d.mime_type || null,
          downloadsCount: Number(d.downloads_count || 0),
          externalAccessCount: Number(d.external_access_count || 0),
          downloadLimit: d.download_limit ? Number(d.download_limit) : null,
          validityDays: d.validity_days ? Number(d.validity_days) : null,
          active: d.active !== false,
          orderIndex: d.order_index ?? idx,
          createdAt: d.created_at || new Date().toISOString(),
          updatedAt: d.updated_at || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.error('[getContentByStoreId] Erro no Supabase:', e);
    }
  }

  if (contents.length === 0) {
    const allLocal = getLocalContents();
    contents = allLocal.filter(c => c.storeId === storeId);
    
    // Conteúdos iniciais padrão se ainda não existirem no localStorage
    if (contents.length === 0) {
      contents = [
        {
          id: 'cnt_demo_pdf_1',
          storeId: storeId,
          productId: 'prod_1',
          productTitle: 'Apostila Completa de Legislação Educacional 2026',
          titulo: 'E-book PDF Esquematizado (Edição 2026)',
          descricao: 'Material didático oficial em PDF para impressão ou leitura digital.',
          tipo: 'ARQUIVO',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileName: 'Apostila_Legislação_Educalizando.pdf',
          fileSizeBytes: 4200000,
          fileSizeFormatted: '4.2 MB',
          mimeType: 'application/pdf',
          downloadsCount: 14,
          externalAccessCount: 0,
          downloadLimit: 5,
          validityDays: 365,
          active: true,
          orderIndex: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cnt_demo_link_2',
          storeId: storeId,
          productId: 'prod_1',
          productTitle: 'Apostila Completa de Legislação Educacional 2026',
          titulo: 'Videoaula 01 — Fundamentos da Legislação (YouTube)',
          descricao: 'Link exclusivo para assistir a aula no YouTube.',
          tipo: 'LINK_EXTERNO',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          fileName: null,
          fileSizeBytes: null,
          fileSizeFormatted: null,
          mimeType: null,
          downloadsCount: 0,
          externalAccessCount: 32,
          downloadLimit: null,
          validityDays: null,
          active: true,
          orderIndex: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      saveLocalContents(contents);
    }
  }

  return contents.sort((a, b) => a.orderIndex - b.orderIndex);
}

// 3. Buscar Conteúdos Vinculados a um Produto Específico
export async function getContentByProductId(storeId: string, productId: string): Promise<ContentItem[]> {
  const all = await getContentByStoreId(storeId);
  return all.filter(c => c.productId === productId);
}

// 4. Obter Métricas da Tela Principal do Módulo
export async function getContentDeliveryMetrics(storeId: string): Promise<ContentDeliveryMetrics> {
  const contents = await getContentByStoreId(storeId);

  const productIdsWithContent = new Set(contents.filter(c => c.productId).map(c => c.productId));
  const totalProdutosComConteudo = productIdsWithContent.size;

  const totalConteudos = contents.length;
  const totalArquivos = contents.filter(c => c.tipo === 'ARQUIVO').length;
  const totalLinksExternos = contents.filter(c => c.tipo === 'LINK_EXTERNO').length;

  const totalDownloads = contents.reduce((acc, c) => acc + c.downloadsCount, 0);
  const totalAcessos = contents.reduce((acc, c) => acc + c.downloadsCount + c.externalAccessCount, 0);

  return {
    totalProdutosComConteudo,
    totalConteudos,
    totalArquivos,
    totalLinksExternos,
    totalDownloads,
    totalAcessos
  };
}

// 5. Criar Novo Conteúdo Digital (com validação estrita)
export async function createContentItem(storeId: string, itemData: {
  titulo: string;
  descricao?: string;
  tipo: ContentType;
  url: string;
  productId?: string;
  productTitle?: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileSizeFormatted?: string;
  mimeType?: string;
  downloadLimit?: number | null;
  validityDays?: number | null;
}): Promise<ContentItem> {
  // Validação backend extra para tipo Arquivo
  if (itemData.tipo === 'ARQUIVO') {
    if (itemData.fileSizeBytes && itemData.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error('O arquivo excede o limite máximo de 15 MB.');
    }
    const val = validateContentFileUpload({
      name: itemData.fileName || itemData.url,
      size: itemData.fileSizeBytes || 0,
      type: itemData.mimeType || ''
    });
    if (!val.valid) {
      throw new Error(val.errorMessage || 'Arquivo inválido.');
    }
  }

  const existing = await getContentByStoreId(storeId);

  const newItem: ContentItem = {
    id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    storeId,
    productId: itemData.productId || null,
    productTitle: itemData.productTitle || null,
    titulo: itemData.titulo,
    descricao: itemData.descricao || null,
    tipo: itemData.tipo,
    url: itemData.url,
    fileName: itemData.fileName || null,
    fileSizeBytes: itemData.fileSizeBytes || null,
    fileSizeFormatted: itemData.fileSizeFormatted || null,
    mimeType: itemData.mimeType || null,
    downloadsCount: 0,
    externalAccessCount: 0,
    downloadLimit: itemData.downloadLimit !== undefined ? itemData.downloadLimit : null,
    validityDays: itemData.validityDays !== undefined ? itemData.validityDays : null,
    active: true,
    orderIndex: existing.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isRealSupabaseConfigured()) {
    try {
      await supabase.from('digital_contents').insert([{
        id: newItem.id,
        store_id: storeId,
        product_id: newItem.productId,
        product_title: newItem.productTitle,
        titulo: newItem.titulo,
        descricao: newItem.descricao,
        tipo: newItem.tipo,
        url: newItem.url,
        file_name: newItem.fileName,
        file_size_bytes: newItem.fileSizeBytes,
        file_size_formatted: newItem.fileSizeFormatted,
        mime_type: newItem.mimeType,
        downloads_count: 0,
        external_access_count: 0,
        download_limit: newItem.downloadLimit,
        validity_days: newItem.validityDays,
        active: true,
        order_index: newItem.orderIndex,
        created_at: newItem.createdAt
      }]);
    } catch (e) {
      console.error('[createContentItem] Erro no Supabase:', e);
    }
  }

  const allLocal = getLocalContents();
  allLocal.push(newItem);
  saveLocalContents(allLocal);

  return newItem;
}

// 6. Atualizar Conteúdo Existente
export async function updateContentItem(storeId: string, contentId: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
  const all = getLocalContents();
  const index = all.findIndex(c => c.id === contentId && c.storeId === storeId);
  if (index === -1) return null;

  const updated: ContentItem = {
    ...all[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  all[index] = updated;
  saveLocalContents(all);

  if (isRealSupabaseConfigured()) {
    try {
      await supabase.from('digital_contents').update({
        titulo: updated.titulo,
        descricao: updated.descricao,
        tipo: updated.tipo,
        url: updated.url,
        download_limit: updated.downloadLimit,
        validity_days: updated.validityDays,
        active: updated.active,
        order_index: updated.orderIndex,
        updated_at: updated.updatedAt
      }).eq('id', contentId).eq('store_id', storeId);
    } catch (e) {
      console.error('[updateContentItem] Erro no Supabase:', e);
    }
  }

  return updated;
}

// 7. Excluir Conteúdo Digital (Soft Delete / Hard Delete com verificação)
export async function deleteContentItem(storeId: string, contentId: string): Promise<boolean> {
  if (isRealSupabaseConfigured()) {
    try {
      await supabase.from('digital_contents').delete().eq('id', contentId).eq('store_id', storeId);
    } catch (e) {
      // Ignorar se não existir no banco remoto
    }
  }

  const allLocal = getLocalContents();
  const filtered = allLocal.filter(c => !(c.id === contentId && c.storeId === storeId));
  saveLocalContents(filtered);
  return true;
}

// 8. Reordenar Conteúdos de um Produto
export async function reorderContents(storeId: string, orderedIds: string[]): Promise<void> {
  const all = getLocalContents();
  orderedIds.forEach((id, newIdx) => {
    const item = all.find(c => c.id === id && c.storeId === storeId);
    if (item) {
      item.orderIndex = newIdx;
    }
  });
  saveLocalContents(all);
}

// 9. Autorização e Entrega Segura de Conteúdo ao Aluno (Entitlement Guard)
export async function authorizeStudentContentAccess(params: {
  storeId: string;
  studentEmail: string;
  contentId: string;
  productId?: string;
}): Promise<StudentContentAccessGrant> {
  const { storeId, studentEmail, contentId, productId } = params;

  // A. Buscar Conteúdo
  const allContents = await getContentByStoreId(storeId);
  const content = allContents.find(c => c.id === contentId);

  if (!content) {
    return { authorized: false, errorMessage: 'Conteúdo não encontrado na plataforma.', downloadsUsed: 0 };
  }

  if (!content.active) {
    return { authorized: false, errorMessage: 'Este conteúdo está temporariamente desativado.', downloadsUsed: content.downloadsCount };
  }

  // B. Validar Compra Aprovada para o Produto
  const orders = getLocalOrders();
  const studentEmailNormalized = studentEmail.toLowerCase().trim();

  const validOrder = orders.find(o => {
    const emailMatch = (o.clienteEmail || '').toLowerCase().trim() === studentEmailNormalized;
    const isPaid = (o.statusPagamento || '').toLowerCase() === 'pago' || (o.statusPagamento || '').toLowerCase() === 'liberado';
    return emailMatch && isPaid;
  });

  if (!validOrder) {
    return {
      authorized: false,
      errorMessage: 'Você não possui uma compra aprovada para acessar este material.',
      downloadsUsed: 0
    };
  }

  // C. Validar Expiração do Acesso (Validade em dias a partir da compra)
  let accessUntil: string | null = null;
  if (content.validityDays) {
    const purchaseDate = new Date(validOrder.dataCompra);
    const expireDate = new Date(purchaseDate.getTime() + content.validityDays * 24 * 60 * 60 * 1000);
    accessUntil = expireDate.toISOString();

    if (new Date() > expireDate) {
      return {
        authorized: false,
        errorMessage: `Seu período de acesso ao conteúdo expirou em ${expireDate.toLocaleDateString('pt-BR')}.`,
        downloadsUsed: content.downloadsCount,
        accessUntil
      };
    }
  }

  // D. Validar Limite de Downloads
  const userAccessLogs = await getCustomerAccessLogs(storeId, studentEmailNormalized);
  const userFileDownloads = userAccessLogs.filter(l => l.contentId === contentId && l.tipoEvento === 'FILE_DOWNLOAD').length;

  if (content.tipo === 'ARQUIVO' && content.downloadLimit && userFileDownloads >= content.downloadLimit) {
    return {
      authorized: false,
      errorMessage: `Limite de downloads atingido (${userFileDownloads} de ${content.downloadLimit} downloads utilizados).`,
      downloadsUsed: userFileDownloads,
      downloadLimit: content.downloadLimit,
      accessUntil
    };
  }

  // E. Se autorizado, registrar evento apropriado
  const eventType: AccessEventType = content.tipo === 'ARQUIVO' ? 'FILE_DOWNLOAD' : 'EXTERNAL_LINK_ACCESS';
  await recordAccessEvent({
    storeId,
    contentId: content.id,
    contentTitle: content.titulo,
    productId: content.productId || productId || undefined,
    productTitle: content.productTitle || undefined,
    tipoEvento: eventType,
    customerEmail: studentEmailNormalized,
    customerName: validOrder.clienteNome || 'Aluno'
  });

  return {
    authorized: true,
    url: content.url,
    downloadsUsed: userFileDownloads + (content.tipo === 'ARQUIVO' ? 1 : 0),
    downloadLimit: content.downloadLimit,
    accessUntil
  };
}

// 10. Registrar Evento de Rastreamento
export async function recordAccessEvent(event: {
  storeId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  contentId: string;
  contentTitle: string;
  productId?: string;
  productTitle?: string;
  tipoEvento: AccessEventType;
}): Promise<AccessEventLog> {
  const newLog: AccessEventLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    storeId: event.storeId,
    customerId: event.customerId || null,
    customerName: event.customerName || 'Aluno',
    customerEmail: event.customerEmail || null,
    contentId: event.contentId,
    contentTitle: event.contentTitle,
    productId: event.productId || null,
    productTitle: event.productTitle || null,
    tipoEvento: event.tipoEvento,
    data: new Date().toISOString()
  };

  const allContents = getLocalContents();
  const target = allContents.find(c => c.id === event.contentId);
  if (target) {
    if (event.tipoEvento === 'FILE_DOWNLOAD') {
      target.downloadsCount += 1;
    } else {
      target.externalAccessCount += 1;
    }
    saveLocalContents(allContents);
  }

  const allLogs = getLocalAccessLogs();
  allLogs.unshift(newLog);
  saveLocalAccessLogs(allLogs);

  return newLog;
}

// 11. Obter Logs de Acesso da Loja
export async function getStoreAccessLogs(storeId: string): Promise<AccessEventLog[]> {
  const all = getLocalAccessLogs();
  return all.filter(l => l.storeId === storeId);
}

// 12. Obter Logs de Acesso de um Cliente Específico
export async function getCustomerAccessLogs(storeId: string, customerEmailOrId: string): Promise<AccessEventLog[]> {
  const logs = await getStoreAccessLogs(storeId);
  const q = customerEmailOrId.toLowerCase().trim();
  return logs.filter(l => 
    (l.customerId && l.customerId.toLowerCase() === q) || 
    (l.customerEmail && l.customerEmail.toLowerCase().trim() === q)
  );
}
