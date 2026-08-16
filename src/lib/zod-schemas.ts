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
  instagram: z.string().or(z.literal('')).optional()
});

export type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

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
