import { supabase, isRealSupabaseConfigured } from './supabase';

/**
 * =============================================================================
 * EDUCALIZANDO — MÓDULO CONTEÚDO & ENTREGAS (SERVICE & SECURITY VALIDATION)
 * =============================================================================
 * Regras Inegociáveis da Plataforma:
 * 1. LIMITE MÁXIMO DE ARQUIVO: 15 MB por arquivo (15.728.640 bytes).
 * 2. PROIBIÇÃO DE VÍDEOS: NENHUM arquivo de vídeo pode ser enviado para o storage.
 * 3. VÍDEOS POR LINK EXTERNO: Vídeos devem ser cadastrados apenas como link externo
 *    (YouTube, Vimeo, Google Drive, etc.).
 * 4. RASTREAMENTO DIFERENCIADO:
 *    - Download de arquivo físico -> evento FILE_DOWNLOAD (contabilizado em Downloads).
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
  createdAt: string;
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
const LOCAL_CONTENT_KEY = 'educalizando_store_contents_v1';
const LOCAL_ACCESS_LOGS_KEY = 'educalizando_store_access_logs_v1';

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

// 2. Buscar Todos os Conteúdos por Loja
export async function getContentByStoreId(storeId: string): Promise<ContentItem[]> {
  if (!storeId) return [];

  let contents: ContentItem[] = [];

  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('digital_contents')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        contents = data.map((d: any) => ({
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
          createdAt: d.created_at
        }));
      }
    } catch (e) {
      console.error('[getContentByStoreId] Erro ao buscar conteúdos no Supabase:', e);
    }
  }

  // Fallback local se vazio
  if (contents.length === 0) {
    const allLocal = getLocalContents();
    contents = allLocal.filter(c => c.storeId === storeId);
    
    // Conteúdos de demonstração iniciais padrão se ainda não existirem
    if (contents.length === 0) {
      contents = [
        {
          id: 'content_demo_1',
          storeId: storeId,
          productTitle: 'Apostila Completa de Legislação Educacional 2026',
          titulo: 'E-book em PDF Esquematizado (Edição 2026)',
          descricao: 'Material didático oficial em PDF para impressão ou leitura digital.',
          tipo: 'ARQUIVO',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileName: 'Apostila_Legislação_Educalizando.pdf',
          fileSizeBytes: 4200000,
          fileSizeFormatted: '4.2 MB',
          mimeType: 'application/pdf',
          downloadsCount: 14,
          externalAccessCount: 0,
          createdAt: new Date().toISOString()
        },
        {
          id: 'content_demo_2',
          storeId: storeId,
          productTitle: 'Curso de Didática Avançada para Concursos',
          titulo: 'Videoaula 01 — Fundamentos da Didática (YouTube)',
          descricao: 'Link oficial da aula no YouTube com acesso restrito a compradores.',
          tipo: 'LINK_EXTERNO',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          fileName: null,
          fileSizeBytes: null,
          fileSizeFormatted: null,
          mimeType: null,
          downloadsCount: 0,
          externalAccessCount: 32,
          createdAt: new Date().toISOString()
        }
      ];
      saveLocalContents(contents);
    }
  }

  return contents;
}

// 3. Obter Métricas do Módulo Conteúdo & Entregas
export async function getContentDeliveryMetrics(storeId: string): Promise<ContentDeliveryMetrics> {
  const contents = await getContentByStoreId(storeId);
  const logs = await getStoreAccessLogs(storeId);

  const totalConteudos = contents.length;
  const totalArquivos = contents.filter(c => c.tipo === 'ARQUIVO').length;
  const totalLinksExternos = contents.filter(c => c.tipo === 'LINK_EXTERNO').length;

  const totalDownloads = contents.reduce((acc, c) => acc + c.downloadsCount, 0);
  const totalAcessos = contents.reduce((acc, c) => acc + c.downloadsCount + c.externalAccessCount, 0);

  return {
    totalConteudos,
    totalArquivos,
    totalLinksExternos,
    totalDownloads,
    totalAcessos
  };
}

// 4. Criar Novo Conteúdo Digital (com validação estrita)
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
    createdAt: new Date().toISOString()
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
        created_at: newItem.createdAt
      }]);
    } catch (e) {
      console.error('[createContentItem] Erro no Supabase:', e);
    }
  }

  // Persistir no storage local
  const allLocal = getLocalContents();
  allLocal.unshift(newItem);
  saveLocalContents(allLocal);

  return newItem;
}

// 5. Excluir Conteúdo Digital
export async function deleteContentItem(storeId: string, contentId: string): Promise<boolean> {
  if (isRealSupabaseConfigured()) {
    try {
      await supabase.from('digital_contents').delete().eq('id', contentId).eq('store_id', storeId);
    } catch (e) {
      // Ignorar erro se não existir na tabela remota
    }
  }

  const allLocal = getLocalContents();
  const filtered = allLocal.filter(c => !(c.id === contentId && c.storeId === storeId));
  saveLocalContents(filtered);
  return true;
}

// 6. Registrar Evento de Rastreamento (FILE_DOWNLOAD vs EXTERNAL_LINK_ACCESS)
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

  // Atualizar contador no objeto do conteúdo
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

// 7. Obter Logs de Acesso da Loja
export async function getStoreAccessLogs(storeId: string): Promise<AccessEventLog[]> {
  const all = getLocalAccessLogs();
  return all.filter(l => l.storeId === storeId);
}

// 8. Obter Logs de Acesso de um Cliente Específico
export async function getCustomerAccessLogs(storeId: string, customerEmailOrId: string): Promise<AccessEventLog[]> {
  const logs = await getStoreAccessLogs(storeId);
  const q = customerEmailOrId.toLowerCase().trim();
  return logs.filter(l => 
    (l.customerId && l.customerId.toLowerCase() === q) || 
    (l.customerEmail && l.customerEmail.toLowerCase().trim() === q)
  );
}
