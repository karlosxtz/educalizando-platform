import { toast } from 'sonner';
export async function copyAiContent(text: string, type: 'whatsapp' | 'instagram') {
  if (!text) return;
  try { await navigator.clipboard.writeText(text); toast.success(`${type === 'whatsapp' ? 'WhatsApp' : 'Instagram'} copiado para a área de transferência.`); }
  catch { toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.'); }
}
export function requestAiTest(storeName?: string | null) {
  const message = ['Olá, equipe Educalizando! 👋', '', `A loja *${storeName?.trim() || 'Loja não identificada'}* deseja realizar um teste da função Marketing IA.`, '', 'Podem me orientar sobre a liberação do teste? 🤖✨'].join('\n');
  window.open(`https://wa.me/5521965008441?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}
