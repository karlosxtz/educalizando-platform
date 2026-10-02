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

/** Entrega principal cadastrada no produto (fora da lista opcional de conteúdos). */
export interface ProductDeliverySummary {
  productId: string;
  productTitle: string;
  url: string;
  fileName?: string | null;
  updatedAt?: string | null;
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

