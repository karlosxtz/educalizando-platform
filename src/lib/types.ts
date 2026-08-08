export type ProductType = 'pdf' | 'ebook' | 'video' | 'curso' | 'simulado';
export type ProductStatus = 'rascunho' | 'publicado';

export interface Store {
  id: string;
  creator_id: string;
  nome_loja: string;
  slug: string;
  descricao: string | null;
  logo_url: string | null;
  banner_url: string | null;
  cor_primaria: string; // Hex color code e.g. "#ff5722"
  asaas_subaccount_id: string | null; // Reserved for future payment split
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  store_id: string;
  titulo: string;
  descricao: string | null;
  tipo: ProductType;
  preco: number;
  capa_url: string | null;
  arquivo_url: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at?: string;
}
