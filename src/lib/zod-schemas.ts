import { z } from 'zod';

export const creatorSignupSchema = z.object({
  fullName: z.string().min(3, { message: 'O nome completo deve ter pelo menos 3 caracteres.' }),
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
