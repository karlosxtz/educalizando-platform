'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, MessageCircle, Save, Send, Sparkles, UserPlus, WalletCards } from 'lucide-react';
import { toast } from 'sonner';

type TemplateKey = 'whatsapp_template_creator' | 'whatsapp_template_student' | 'whatsapp_template_affiliate' | 'whatsapp_template_creator_sale' | 'whatsapp_template_buyer_sale';

const PRESETS: Array<{ key: TemplateKey; title: string; description: string; icon: typeof UserPlus; color: string; variables: string; text: string }> = [
  { key: 'whatsapp_template_creator', title: 'Boas-vindas: Criador', description: 'Enviada ao finalizar o cadastro de uma nova loja.', icon: UserPlus, color: 'text-emerald-400 bg-emerald-500/10', variables: '{{nome}}', text: 'Olá {{nome}}! 👋\n\nQue alegria ter você na Educalizando! Sua loja acaba de nascer.\n\nAcesse seu painel para publicar seus materiais: https://www.educalizando.com.br/dashboard\n\nConte com a gente! 💙' },
  { key: 'whatsapp_template_student', title: 'Boas-vindas: Cliente', description: 'Enviada para quem cria uma conta para comprar materiais.', icon: UserPlus, color: 'text-blue-400 bg-blue-500/10', variables: '{{nome}}', text: 'Olá {{nome}}! 👋\n\nSeja bem-vindo(a) à Educalizando! Aqui você encontra materiais prontos para transformar suas aulas.\n\nExplore o acervo: https://www.educalizando.com.br/buscar' },
  { key: 'whatsapp_template_affiliate', title: 'Boas-vindas: Afiliado', description: 'Enviada ao entrar no programa de indicações.', icon: UserPlus, color: 'text-violet-400 bg-violet-500/10', variables: '{{nome}}', text: 'Olá {{nome}}! 👋\n\nSeja bem-vindo(a) ao programa de Afiliados Educalizando!\n\nAcesse sua área para gerar links e acompanhar suas indicações: https://www.educalizando.com.br/dashboard/afiliacoes' },
  { key: 'whatsapp_template_creator_sale', title: 'Alerta: Nova venda', description: 'Enviada para o WhatsApp configurado na loja após pagamento confirmado.', icon: WalletCards, color: 'text-amber-400 bg-amber-500/10', variables: '{{nome}}, {{comprador}}, {{produto}}, {{valor}}, {{pedido}}', text: '💰 Nova venda confirmada!\n\nOlá, {{nome}}! {{comprador}} comprou {{produto}}.\n\nValor líquido: {{valor}}\nPedido: #{{pedido}}\n\nAcompanhe no seu painel: https://www.educalizando.com.br/dashboard/pedidos' },
  { key: 'whatsapp_template_buyer_sale', title: 'Confirmação: Compra aprovada', description: 'Enviada ao comprador quando o pagamento é confirmado.', icon: CheckCircle2, color: 'text-cyan-400 bg-cyan-500/10', variables: '{{nome}}, {{produto}}, {{valor}}, {{pedido}}', text: '✅ Compra confirmada!\n\nOlá, {{nome}}! Seu pagamento foi aprovado.\n\nMaterial(is): {{produto}}\nTotal: {{valor}}\n\nSeus materiais já estão disponíveis em: https://www.educalizando.com.br/cliente/dashboard' },
];

export default function WhatsAppAutomationsPage() {
  const emptyTemplates = useMemo(() => Object.fromEntries(PRESETS.map((item) => [item.key, ''])) as Record<TemplateKey, string>, []);
  const [templates, setTemplates] = useState<Record<TemplateKey, string>>(emptyTemplates);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrationConfigured, setIntegrationConfigured] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/admin/whatsapp-automations');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setIntegrationConfigured(Boolean(data.integrationConfigured));
        setTemplates({ ...emptyTemplates, ...Object.fromEntries(PRESETS.map((item) => [item.key, data.templates?.[item.key] || ''])) });
      } catch (error: any) {
        toast.error(error.message || 'Não foi possível carregar as automações.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [emptyTemplates]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/whatsapp-automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(templates) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success('Automações de WhatsApp salvas.');
    } catch (error: any) {
      toast.error(error.message || 'Não foi possível salvar as automações.');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (item: typeof PRESETS[number]) => setTemplates((current) => ({ ...current, [item.key]: item.text }));
  const copyPreset = async (item: typeof PRESETS[number]) => { await navigator.clipboard.writeText(item.text); toast.success('Texto sugerido copiado.'); };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-300"><MessageCircle className="h-4 w-4" /> Comunicação automática</p><h1 className="mt-3 text-3xl font-black text-white">Automações do WhatsApp</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Organize todas as mensagens da Evolution em um único lugar. As mensagens só são enviadas após o evento acontecer de verdade — cadastro concluído ou pagamento confirmado.</p></div><div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${integrationConfigured ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}><span className={`h-2 w-2 rounded-full ${integrationConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />{integrationConfigured ? 'Evolution configurada' : 'Evolution precisa ser configurada na Vercel'}</div></div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300"><div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" /><div><p className="font-bold text-white">Como funciona</p><p className="mt-1 leading-relaxed">O alerta de nova venda usa o WhatsApp salvo em <strong>Configuração da Loja</strong> de cada criador. A confirmação do comprador usa o telefone informado no checkout ou o WhatsApp cadastrado na conta. Mensagens de uma mesma venda não são duplicadas.</p></div></div></section>

      {loading ? <div className="rounded-2xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">Carregando automações…</div> : <div className="space-y-5">{PRESETS.map((item) => { const Icon = item.icon; const value = templates[item.key]; return <article key={item.key} className="rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}><Icon className="h-5 w-5" /></div><div><h2 className="font-black text-white">{item.title}</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">{item.description}</p><p className="mt-2 text-[11px] font-semibold text-slate-500">Variáveis: {item.variables}</p></div></div><div className="flex gap-2"><button type="button" onClick={() => applyPreset(item)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-200 hover:border-emerald-500 hover:text-emerald-300"><Send className="h-3.5 w-3.5" /> Usar sugerida</button><button type="button" onClick={() => copyPreset(item)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-700 px-3 text-slate-300 hover:text-white" aria-label={`Copiar texto de ${item.title}`}><Copy className="h-4 w-4" /></button></div></div><textarea value={value} onChange={(event) => setTemplates((current) => ({ ...current, [item.key]: event.target.value }))} rows={7} className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder={item.text} /></article>; })}</div>}

      <div className="sticky bottom-4 flex justify-end"><button type="button" onClick={save} disabled={loading || saving} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Salvando…' : 'Salvar automações'}</button></div>
    </div>
  );
}
