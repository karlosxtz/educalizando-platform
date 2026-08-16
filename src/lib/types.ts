export type ProductType = 'pdf' | 'ebook' | 'video' | 'curso' | 'simulado';
export type ProductStatus = 'rascunho' | 'publicado' | 'excluido';

export interface Store {
  id: string;
  creator_id: string;
  nome_loja: string;
  slug: string;
  descricao: string | null;
  logo_url: string | null;
  banner_url: string | null;
  cor_primaria: string; // Hex color code e.g. "#2563eb"
  asaas_subaccount_id: string | null; // Reserved for future payment split
  whatsapp?: string | null;
  instagram?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  nome: string;
  slug: string;
  store_id: string | null; // NULL = global platform category, string = custom creator category
  created_at: string;
}

export interface EducationLevel {
  id: string;
  nome: string;
  slug: string;
  ordem: number;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  ordem: number;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  titulo: string;
  descricao: string | null;
  tipo: ProductType;
  preco: number;
  is_plr?: boolean;
  capa_url: string | null;
  arquivo_url: string | null;
  status: ProductStatus;
  category_id?: string | null;
  education_level_id?: string | null;
  category?: Category | null;
  education_level?: EducationLevel | null;
  images?: ProductImage[];
  gallery_urls?: string[]; // Transient field for creating/updating
  excluido_em?: string | null;
  average_rating?: number;
  review_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface KitItem {
  id: string;
  kit_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

export interface Kit {
  id: string;
  store_id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  preco_kit: number;
  status: ProductStatus;
  items?: KitItem[];
  products?: Product[];
  excluido_em?: string | null;
  created_at: string;
  updated_at?: string;
}

export type PeriodFilter = '7d' | '30d' | 'month' | 'year';

export interface SalesDataPoint {
  date: string;
  label: string;
  revenue: number;
  salesCount: number;
}

export interface TopProductStat {
  id: string;
  titulo: string;
  tipo: ProductType;
  preco: number;
  unidadesVendidas: number;
  faturamentoTotal: number;
  porcentagem: number;
  capa_url: string | null;
}

export interface RecentOrder {
  id: string;
  clienteNome: string;
  clienteEmail: string;
  produtoTitulo: string;
  tipoProduto: ProductType;
  valorTotal: number;
  statusPagamento: 'pago' | 'pendente_pix' | 'expirado';
  dataCompra: string;
  metodoPagamento: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
}

export interface Purchase {
  id: string;
  student_id: string;
  product_id?: string | null;
  kit_id?: string | null;
  store_id: string;
  status: 'liberado' | 'pendente' | 'pago' | 'estornado';
  created_at: string;
  product?: Product | null;
  kit?: Kit | null;
  store?: Store | null;
}

export type CouponDiscountType = 'percentual' | 'valor_fixo';
export type CouponStatus = 'ativo' | 'inativo';

export interface CouponProduct {
  id: string;
  coupon_id: string;
  product_id?: string | null;
  kit_id?: string | null;
}

export interface Coupon {
  id: string;
  store_id: string;
  codigo: string;
  tipo_desconto: CouponDiscountType;
  valor_desconto: number;
  data_inicio: string;
  data_expiracao?: string | null;
  limite_de_usos?: number | null;
  usos_atuais: number;
  status: CouponStatus;
  coupon_products?: CouponProduct[];
  created_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  coupon?: Coupon | null;
  finalPrice?: number;
  discountAmount?: number;
}

export type ReviewStatus = 'aprovado' | 'pendente' | 'oculto';

export interface Review {
  id: string;
  product_id: string;
  student_id: string;
  store_id: string;
  nota: number;
  comentario?: string | null;
  student_name?: string; // We can enrich this for display
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingCounts: { [stars: number]: number };
}

export interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
}

