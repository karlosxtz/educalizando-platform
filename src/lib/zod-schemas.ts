import { z } from 'zod';

export const creatorSignupSchema = z.object({
  fullName: z.string().min(3, { message: 'O nome completo deve ter pelo menos 3 caracteres.' }),
  cpf: z
    .string()
    .min(9, { message: 'Informe um CPF válido para vinculação da chave PIX.' })
    .refine((val) => {
      const nums = val.replace(/\D/g, '');
      return nums === '123456789' || nums.length === 11;
    }, {
      message: 'CPF deve conter exatamente 11 dígitos numéricos ou o valor de teste.'
    }),
  email: z.string().email({ message: 'Digite um endereço de e-mail válido.' }),
  password: z
    .string()
    .min(8, { message: 'A senha deve conter no mínimo 8 caracteres.' })
    .regex(/[A-Z]/, { message: 'A senha deve conter pelo menos uma letra maiúscula.' })
    .regex(/[0-9]/, { message: 'A senha deve conter pelo menos um número.' }),
  confirmPassword: z.string(),
  storeName: z
    .string()
    .min(3, { message: 'O nome da loja/marca deve ter pelo menos 3 caracteres.' })
    .max(40, { message: 'O nome da loja não pode ter mais que 40 caracteres.' }),
  whatsapp: z
    .string()
    .min(10, { message: 'Informe um número de WhatsApp válido com DDD.' })
    .max(15),
  category: z.enum([
    'Educação Infantil',
    'Ensino Fundamental',
    'Ensino Médio & ENEM',
    'Concursos Públicos',
    'Ensino Superior & Pós',
    'Idiomas',
    'Desenvolvimento & Outros'
  ], {
    errorMap: () => ({ message: 'Selecione uma área de atuação válida.' })
  }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Você precisa aceitar os Termos de Uso e Política de Privacidade.' })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas digitadas não coincidem.',
  path: ['confirmPassword']
});

export type CreatorSignupFormValues = z.infer<typeof creatorSignupSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z.string().email({ message: 'Digite um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Reset Password Schema
export const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Digite um e-mail válido para recuperação.' })
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Store Customization Schema
export const storeSettingsSchema = z.object({
  nome_loja: z.string().min(3, { message: 'O nome da loja deve ter pelo menos 3 caracteres.' }),
  slug: z
    .string()
    .min(3, { message: 'O link da loja (slug) deve ter pelo menos 3 caracteres.' })
    .regex(/^[a-z0-9-]+$/, { message: 'O link deve conter apenas letras minúsculas, números e hífens.' }),
  descricao: z.string().optional(),
  logo_url: z.string().url({ message: 'URL da imagem de logo inválida.' }).or(z.literal('')).optional(),
  banner_url: z.string().url({ message: 'URL da imagem do banner inválida.' }).or(z.literal('')).optional(),
  cor_primaria: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Selecione uma cor hexadecimal válida (ex: #ff5722).' }),
  whatsapp: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, { message: 'Use o formato (XX) XXXXX-XXXX' }).or(z.literal('')).optional(),
  instagram: z.string().or(z.literal('')).optional(),
  layout_theme: z.string().optional(),
  author_image_url: z.string().url({ message: 'URL da imagem do autor inválida.' }).or(z.literal('')).optional(),
  author_bio: z.string().optional(),
  youtube: z.string().or(z.literal('')).optional(),
  tiktok: z.string().or(z.literal('')).optional(),
  facebook: z.string().or(z.literal('')).optional(),
  website: z.string().url({ message: 'URL do site inválida.' }).or(z.literal('')).optional(),
  button_style: z.enum(['rounded', 'pill', 'square']).optional(),
  welcome_message: z.string().optional()
});

export type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

export const affiliateProfileSchema = z.object({
  nome: z.string().min(3, { message: 'O nome da vitrine deve ter pelo menos 3 caracteres.' }),
  slug: z
    .string()
    .min(3, { message: 'O link da vitrine (slug) deve ter pelo menos 3 caracteres.' })
    .regex(/^[a-z0-9-]+$/, { message: 'O link deve conter apenas letras minúsculas, números e hífens.' }),
  descricao: z.string().optional(),
  logo_url: z.string().url({ message: 'URL da imagem de logo inválida.' }).or(z.literal('')).optional(),
  banner_url: z.string().url({ message: 'URL da imagem do banner inválida.' }).or(z.literal('')).optional(),
  cor_primaria: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Selecione uma cor hexadecimal válida (ex: #ff5722).' }),
  whatsapp: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, { message: 'Use o formato (XX) XXXXX-XXXX' }).or(z.literal('')).optional(),
  instagram: z.string().or(z.literal('')).optional(),
  tema: z.string().optional(),
  youtube: z.string().or(z.literal('')).optional(),
  tiktok: z.string().or(z.literal('')).optional(),
  facebook: z.string().or(z.literal('')).optional()
});

export type AffiliateProfileFormValues = z.infer<typeof affiliateProfileSchema>;

// Product Form Schema
export const productFormSchema = z.object({
  titulo: z.string().min(4, { message: 'O título do material deve ter pelo menos 4 caracteres.' }),
  descricao: z.string().optional(),
  tipo: z.enum(['pdf', 'ebook', 'video', 'curso', 'simulado'], {
    errorMap: () => ({ message: 'Selecione um tipo de produto válido.' })
  }),
  preco: z.coerce.number().min(0, { message: 'O preço não pode ser negativo.' }),
  capa_url: z.string().url({ message: 'URL da capa inválida.' }).or(z.literal('')).optional(),
  arquivo_url: z.string().url({ message: 'URL do arquivo inválida.' }).or(z.literal('')).optional(),
  status: z.enum(['rascunho', 'publicado'])
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

// =============================================================================
// COUPON SCHEMA
// =============================================================================
export const couponFormSchema = z.object({
  codigo: z
    .string()
    .min(3, { message: 'O código deve ter pelo menos 3 caracteres.' })
    .max(30, { message: 'O código não pode ter mais que 30 caracteres.' })
    .regex(/^[A-Z0-9_-]+$/, { message: 'Apenas letras maiúsculas, números, _ e - são permitidos.' }),
  tipo_desconto: z.enum(['percentual', 'valor_fixo'], {
    errorMap: () => ({ message: 'Selecione um tipo de desconto válido.' })
  }),
  valor_desconto: z.coerce
    .number()
    .min(0.01, { message: 'O valor do desconto deve ser maior que zero.' })
    .max(100, { message: 'Desconto percentual não pode ultrapassar 100%.' }),
  data_inicio: z.string().min(1, { message: 'Informe a data de início.' }),
  data_expiracao: z.string().nullable().optional(),
  limite_de_usos: z.coerce.number().int().min(1).nullable().optional(),
  status: z.enum(['ativo', 'inativo']).default('ativo')
});

export type CouponFormValues = z.infer<typeof couponFormSchema>;

// =============================================================================
// WITHDRAWAL (SAQUE) SCHEMA
// =============================================================================
export const withdrawalRequestSchema = z.object({
  amount: z.coerce
    .number()
    .min(1.00, { message: 'O valor mínimo para saque é R$ 1,00.' })
    .max(50000, { message: 'O valor máximo por saque é R$ 50.000,00.' }),
  pixKeyId: z.string().uuid({ message: 'Selecione uma chave PIX válida.' })
});

export type WithdrawalRequestValues = z.infer<typeof withdrawalRequestSchema>;

// =============================================================================
// PIX KEY SCHEMA
// =============================================================================
export const pixKeyFormSchema = z.object({
  cpf: z
    .string()
    .min(11, { message: 'Informe um CPF com 11 dígitos.' })
    .max(14)
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 11, { message: 'CPF deve ter exatamente 11 dígitos.' })
});

export type PixKeyFormValues = z.infer<typeof pixKeyFormSchema>;

// =============================================================================
// REVIEW (AVALIAÇÃO) SCHEMA
// =============================================================================
export const reviewFormSchema = z.object({
  nota: z.coerce
    .number()
    .int()
    .min(1, { message: 'Selecione pelo menos 1 estrela.' })
    .max(5, { message: 'A nota máxima é 5 estrelas.' }),
  comentario: z
    .string()
    .max(1000, { message: 'O comentário não pode ter mais de 1000 caracteres.' })
    .optional()
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

// =============================================================================
// KIT SCHEMA
// =============================================================================
export const kitFormSchema = z.object({
  titulo: z
    .string()
    .min(4, { message: 'O título do kit deve ter pelo menos 4 caracteres.' })
    .max(100),
  descricao: z.string().max(500).optional(),
  preco_kit: z.coerce
    .number()
    .min(0, { message: 'O preço não pode ser negativo.' }),
  status: z.enum(['rascunho', 'publicado']).default('rascunho'),
  capa_url: z.string().url({ message: 'URL da capa inválida.' }).or(z.literal('')).optional()
});

export type KitFormValues = z.infer<typeof kitFormSchema>;

// =============================================================================
// STUDENT LOGIN / SIGNUP SCHEMA
// =============================================================================
export const studentLoginSchema = z.object({
  email: z.string().email({ message: 'Digite um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
});

export type StudentLoginFormValues = z.infer<typeof studentLoginSchema>;

export const studentSignupSchema = z.object({
  full_name: z
    .string()
    .min(3, { message: 'Informe seu nome completo (mínimo 3 caracteres).' })
    .max(100),
  email: z.string().email({ message: 'Digite um e-mail válido.' }),
  cpf: z
    .string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 11, { message: 'CPF deve ter 11 dígitos.' }),
  password: z
    .string()
    .min(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
    .regex(/[A-Z]/, { message: 'A senha deve ter pelo menos uma letra maiúscula.' })
    .regex(/[0-9]/, { message: 'A senha deve ter pelo menos um número.' }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword']
});

export type StudentSignupFormValues = z.infer<typeof studentSignupSchema>;
