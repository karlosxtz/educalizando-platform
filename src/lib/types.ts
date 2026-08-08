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
  cor_primaria: string; // Hex color code e.g. "#2563eb"
  asaas_subaccount_id: string | null; // Reserved for future payment split
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
  category_id?: string | null;
  education_level_id?: string | null;
  category?: Category | null;
  education_level?: EducationLevel | null;
  created_at: string;
  updated_at?: string;
}
