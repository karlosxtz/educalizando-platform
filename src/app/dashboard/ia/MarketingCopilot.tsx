'use client';

import type { Product,Store } from '@/lib/types';
import { BrainCircuit,CalendarDays,CheckCircle2,Clipboard,FlaskConical,Lightbulb,Loader2,MessageSquareMore,RefreshCw,Rocket,Save,Search,ShoppingBag,Sparkles,Target,Trash2,TrendingUp,Wand2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback,useEffect,useRef,useState } from 'react';
import { toast } from 'sonner';

type Opportunity = { term: string; demand: number; source: 'search' | 'calendar'; daysUntil?: number; priority: number; competition: number; ownProductId: string | null; titleSuggestion: string };
type ProductScore = { id: string; title: string; slug: string | null; coverUrl: string | null; price: number; score: number; suggestions: string[]; views: number; sales: number; conversionRate: number };
type CampaignPerformance = { id: string; code: string; name: string; variant: 'A' | 'B'; product_id: string; created_at: string; clicks: number; sales: number; revenue: number; conversionRate: number };
type CopilotData = {
  summary: { products: number; views: number; sales: number; revenue: number; searchTerms: number };
  opportunities: Opportunity[];
  productScores: ProductScore[];
  campaignPerformance: CampaignPerformance[];
  preferences: { brand_voice: string; primary_audience: string };
};
type CampaignPack = {
  campaignName?: string; whatsapp?: string; instagram?: string; email?: { subject?: string; body?: string };
  adTitles?: string[]; stories?: string[]; plan?: Array<{ day: number; channel: string; action: string }>;
  variantA?: { headline?: string; message?: string; link?: string };
  variantB?: { headline?: string; message?: string; link?: string };
  trackingReady?: boolean; trackingNotice?: string;
};
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };

const tabs = [
  { id: 'radar', label: 'Radar', icon: TrendingUp },
  { id: 'conversion', label: 'Conversão', icon: Target },
  { id: 'campaigns', label: 'Campanhas', icon: Rocket },
  { id: 'assistant', label: 'Assistente', icon: BrainCircuit },
] as const;
type TabId = typeof tabs[number]['id'];

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const preferenceStorageKey = (storeId: string) => `educalizando:ai-marketing-preferences:${storeId}`;
const chatStorageKey = (storeId: string) => `educalizando:ai-marketing-chat:${storeId}`;

export default function MarketingCopilot({ store, products, selectedProductId, aiConfigured, onOptimizeProduct }: { store: Store; products: Product[]; selectedProductId: string; aiConfigured: boolean; onOptimizeProduct: (productId: string) => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('radar');
  const [data, setData] = useState<CopilotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [brandVoice, setBrandVoice] = useState('acolhedora, clara e profissional');
  const [primaryAudience, setPrimaryAudience] = useState('educadores e famílias');
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [generatingPack, setGeneratingPack] = useState(false);
  const [pack, setPack] = useState<CampaignPack | null>(null);
  const [campaignProductId, setCampaignProductId] = useState(selectedProductId);
  const [question, setQuestion] = useState('Qual produto devo divulgar hoje e por quê?');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [asking, setAsking] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/marketing-copilot?storeId=${encodeURIComponent(store.id)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Não foi possível carregar o Agente Eduardo.');
      setData(payload);
      const localPreferences = (() => { try { return JSON.parse(localStorage.getItem(preferenceStorageKey(store.id)) || 'null'); } catch { return null; } })();
      setBrandVoice(localPreferences?.brandVoice || payload.preferences?.brand_voice || 'acolhedora, clara e profissional');
      setPrimaryAudience(localPreferences?.primaryAudience || payload.preferences?.primary_audience || 'educadores e famílias');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar o Agente Eduardo.');
    } finally {
      setLoading(false);
    }
  }, [store.id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (selectedProductId) setCampaignProductId(selectedProductId); }, [selectedProductId]);
  useEffect(() => { if (!campaignProductId && products[0]?.id) setCampaignProductId(products[0].id); }, [campaignProductId, products]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(chatStorageKey(store.id)) || '[]');
      if (Array.isArray(saved)) setMessages(saved.filter(item => (item?.role === 'user' || item?.role === 'assistant') && typeof item?.content === 'string' && item.content.trim()).slice(-20));
    } catch { /* conversa nova */ }
  }, [store.id]);
  useEffect(() => {
    if (typing) return;
    try { localStorage.setItem(chatStorageKey(store.id), JSON.stringify(messages.filter(message => message.content.trim()).slice(-20))); } catch { /* armazenamento indisponível */ }
  }, [messages, store.id, typing]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, asking, typing]);
  useEffect(() => () => { if (typingTimer.current) clearInterval(typingTimer.current); }, []);

  const post = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/ai/marketing-copilot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId: store.id, ...body }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir esta ação.');
    return payload;
  };

  const savePreferences = async () => {
    setSavingPreferences(true);
    try {
      const payload = await post({ action: 'save-preferences', brandVoice, primaryAudience });
      localStorage.setItem(preferenceStorageKey(store.id), JSON.stringify({ brandVoice, primaryAudience }));
      toast.success(payload.persisted === false ? 'Voz da marca salva neste navegador e pronta para as campanhas.' : 'Voz da marca salva. As próximas campanhas seguirão esse estilo.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { setSavingPreferences(false); }
  };

  const generatePack = async () => {
    if (!campaignProductId) return toast.error('Escolha o produto da campanha.');
    if (!aiConfigured) return toast.error('Configure sua chave de IA para gerar a campanha.');
    setGeneratingPack(true); setPack(null);
    try {
      const payload = await post({ action: 'campaign-pack', productId: campaignProductId, brandVoice, primaryAudience });
      setPack(payload.pack);
      toast.success('Campanha completa e teste A/B criados.');
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível gerar a campanha.'); }
    finally { setGeneratingPack(false); }
  };

  const ask = async (suggestedQuestion?: string) => {
    const nextQuestion = suggestedQuestion || question;
    if (!nextQuestion.trim()) return;
    if (!aiConfigured) return toast.error('Configure sua chave de IA para conversar com o Agente Eduardo.');
    if (asking || typing) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: nextQuestion.trim() };
    const previousMessages = messages;
    setMessages(current => [...current, userMessage]); setQuestion(''); setAsking(true);
    try {
      const payload = await post({ action: 'assistant', question: nextQuestion, history: previousMessages.map(({ role, content }) => ({ role, content })), brandVoice, primaryAudience });
      const answer = String(payload.answer || '').replace(/\*{1,3}|`{1,3}/g, '').trim();
      if (answer.length < 20) throw new Error('A resposta chegou incompleta. Tente novamente.');
      const responseId = crypto.randomUUID();
      let cursor = 0;
      setMessages(current => [...current, { id: responseId, role: 'assistant', content: '' }]);
      setTyping(true);
      typingTimer.current = setInterval(() => {
        cursor = Math.min(answer.length, cursor + 8);
        const visible = answer.slice(0, cursor);
        setMessages(current => current.map(message => message.id === responseId ? { ...message, content: visible } : message));
        if (cursor >= answer.length) {
          if (typingTimer.current) clearInterval(typingTimer.current);
          typingTimer.current = null;
          setTyping(false);
        }
      }, 18);
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'O Agente Eduardo não conseguiu responder.';
      setMessages(current => [...current, { id: crypto.randomUUID(), role: 'assistant', content: `Não consegui concluir esta análise agora. Motivo: ${message} Envie novamente para eu analisar os produtos da loja.` }]);
      toast.error(message);
    }
    finally { setAsking(false); }
  };

  const clearChat = () => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    typingTimer.current = null;
    setTyping(false);
    setMessages([]);
    setQuestion('Como está o estado da minha loja hoje?');
    localStorage.removeItem(chatStorageKey(store.id));
  };

  const copy = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => toast.success('Conteúdo copiado.'));
  };

  return <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm">
    <header className="bg-gradient-to-r from-blue-800 via-indigo-700 to-violet-700 p-6 text-white sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">Agente Eduardo de Vendas Pedagógicas</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Decida o que criar, como melhorar e quando divulgar</h2><p className="mt-2 text-sm leading-6 text-blue-100">Dados reais do marketplace, calendário escolar, catálogo e vendas reunidos em ações práticas para a sua loja.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-black backdrop-blur transition hover:bg-white/25 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar análise</button>
      </div>
      {data && <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5"><Metric label="Produtos" value={data.summary.products} /><Metric label="Visualizações" value={data.summary.views} /><Metric label="Vendas 90 dias" value={data.summary.sales} /><Metric label="Receita 90 dias" value={formatCurrency(data.summary.revenue)} /><Metric label="Buscas analisadas" value={data.summary.searchTerms} /></div>}
    </header>

    <div className="border-b border-slate-100 bg-slate-50 p-2 sm:p-3"><div className="flex gap-2 overflow-x-auto">{tabs.map(tab => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${activeTab === tab.id ? 'bg-blue-700 text-white shadow-sm' : 'bg-white text-slate-600 hover:text-blue-700'}`}><tab.icon className="h-4 w-4" />{tab.label}</button>)}</div></div>

    <div className="p-5 sm:p-7">
      {loading && !data ? <div className="flex min-h-56 items-center justify-center gap-3 text-sm font-bold text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Cruzando buscas, calendário, produtos e vendas...</div> : null}

      {data && activeTab === 'radar' && <div>
        <SectionTitle icon={Lightbulb} eyebrow="O que produzir agora" title="Radar de oportunidades" description="A prioridade combina procura, proximidade da data e quantidade de materiais concorrentes." />
        {data.opportunities.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{data.opportunities.map(opportunity => <article key={`${opportunity.source}-${opportunity.term}`} className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${opportunity.priority >= 70 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>Prioridade {opportunity.priority}/100</span><h3 className="mt-3 text-lg font-black text-slate-950">{opportunity.term}</h3></div>{opportunity.source === 'calendar' ? <CalendarDays className="h-6 w-6 text-violet-600" /> : <Search className="h-6 w-6 text-blue-600" />}</div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><SmallMetric label="Buscas/cliques" value={opportunity.demand} /><SmallMetric label="Concorrentes" value={opportunity.competition} /><SmallMetric label="Prazo" value={opportunity.daysUntil === undefined ? 'Agora' : `${opportunity.daysUntil}d`} /></div><div className="mt-4 flex flex-col gap-2 sm:flex-row">{opportunity.ownProductId ? <button type="button" onClick={() => onOptimizeProduct(opportunity.ownProductId!)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white"><Wand2 className="h-4 w-4" />Otimizar produto existente</button> : <Link href={`/dashboard/produtos/novo?titulo=${encodeURIComponent(opportunity.titleSuggestion)}${opportunity.source === 'calendar' ? `&tema=${encodeURIComponent(opportunity.term)}` : ''}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-center text-sm font-black text-white"><Sparkles className="h-4 w-4" />Começar novo produto</Link>}</div></article>)}</div> : <EmptyState text="Ainda não existem buscas suficientes. As próximas datas pedagógicas aparecerão automaticamente." />}
      </div>}

      {data && activeTab === 'conversion' && <div>
        <SectionTitle icon={Target} eyebrow="Melhore antes de divulgar" title="Nota SEO dos produtos" description="Esta é a mesma regra da auditoria em Meus Produtos: título, descrição, capa, categoria, nível, tags e endereço público." />
        <p className="mt-3 rounded-xl bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-900">A IA prepara título, descrição, tags, temas, categoria, nível e faixa indicada. Antes de qualquer alteração, você revisa a proposta e confirma o salvamento.</p>
        <div className="mt-5 space-y-3">{data.productScores.map(product => <article key={product.id} className="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-[minmax(0,1fr)_130px_210px] md:items-center"><div className="min-w-0"><div className="flex items-center gap-3">{product.coverUrl ? <img src={product.coverUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50"><ShoppingBag className="h-5 w-5 text-blue-600" /></div>}<div className="min-w-0"><h3 className="truncate font-black text-slate-950">{product.title}</h3><p className="mt-1 text-xs text-slate-500">Desempenho separado: {product.views} visitas · {product.sales} vendas · conversão {product.conversionRate}%</p></div></div>{product.suggestions.length ? <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-600">{product.suggestions.map(item => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-xs font-bold text-emerald-700">Cadastro SEO completo. Continue acompanhando visitas e vendas.</p>}</div><div className="text-center md:text-left"><strong className={`text-3xl font-black ${product.score >= 80 ? 'text-emerald-600' : product.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{product.score}</strong><span className="text-sm font-bold text-slate-400">/100 SEO</span><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${product.score >= 80 ? 'bg-emerald-500' : product.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${product.score}%` }} /></div></div><button type="button" onClick={() => onOptimizeProduct(product.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white"><Wand2 className="h-4 w-4" />Sugerir ajustes e revisar</button></article>)}</div>
      </div>}

      {data && activeTab === 'campaigns' && <div className="space-y-7">
        <SectionTitle icon={Rocket} eyebrow="Lançamento em um clique" title="Campanha completa e laboratório A/B" description="Crie conteúdo para vários canais e use links diferentes para medir qual mensagem gera mais vendas." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><FunctionInfo title="Conteúdo multicanal" text="Prepara WhatsApp, Instagram, e-mail, anúncios e Stories para o mesmo produto." /><FunctionInfo title="Plano de 7 dias" text="Organiza quando e onde divulgar, sempre a partir da data atual." /><FunctionInfo title="Teste A/B" text="Cria duas mensagens diferentes para comparar cliques e vendas." /><FunctionInfo title="Voz da marca" text="Mantém o jeito de falar da sua loja e direciona a mensagem ao público certo." /></div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-600">Produto que receberá a campanha<select value={campaignProductId} onChange={event => { setCampaignProductId(event.target.value); setPack(null); }} className="mt-2 min-h-12 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm font-bold normal-case text-slate-800 outline-none focus:border-blue-500"><option value="">Escolha um produto publicado</option>{products.map(product => <option key={product.id} value={product.id}>{product.titulo}</option>)}</select><span className="mt-2 block text-[11px] font-medium normal-case leading-5 text-slate-500">A campanha usa o título, a descrição, as tags e os temas deste produto. Ela não altera preço, arquivo nem link.</span></label>
        <div className="grid gap-4 lg:grid-cols-2"><label className="text-xs font-black uppercase tracking-wider text-slate-600">Voz da marca<textarea value={brandVoice} onChange={event => setBrandVoice(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm font-medium normal-case outline-none focus:border-blue-500" placeholder="Ex.: alegre, acolhedora e cheia de energia" /></label><label className="text-xs font-black uppercase tracking-wider text-slate-600">Público principal<textarea value={primaryAudience} onChange={event => setPrimaryAudience(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm font-medium normal-case outline-none focus:border-blue-500" placeholder="Ex.: professoras da Educação Infantil" /></label></div>
        <div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => void savePreferences()} disabled={savingPreferences} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 px-5 text-sm font-black text-blue-800"><Save className="h-4 w-4" />{savingPreferences ? 'Salvando...' : 'Salvar voz da marca'}</button><button type="button" onClick={() => void generatePack()} disabled={generatingPack || !campaignProductId} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-700 px-5 text-sm font-black text-white shadow-lg shadow-violet-100 disabled:opacity-60">{generatingPack ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}{generatingPack ? 'Montando lançamento...' : 'Gerar campanha para o produto escolhido'}</button></div>
        {pack && <CampaignPackView pack={pack} copy={copy} />}
        <div><h3 className="text-lg font-black text-slate-950">Resultados dos testes A/B</h3><p className="mt-1 text-sm text-slate-500">Cliques e vendas são atribuídos automaticamente pelos links criados acima.</p>{data.campaignPerformance.length ? <div className="mt-4 overflow-x-auto rounded-2xl border"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Campanha</th><th className="p-3">Versão</th><th className="p-3">Cliques</th><th className="p-3">Vendas</th><th className="p-3">Conversão</th><th className="p-3">Receita</th></tr></thead><tbody>{data.campaignPerformance.map(item => <tr key={item.id} className="border-t"><td className="p-3 font-bold text-slate-800">{item.name}</td><td className="p-3"><span className="rounded-full bg-violet-100 px-2 py-1 font-black text-violet-700">{item.variant}</span></td><td className="p-3">{item.clicks}</td><td className="p-3">{item.sales}</td><td className="p-3">{item.conversionRate}%</td><td className="p-3">{formatCurrency(item.revenue)}</td></tr>)}</tbody></table></div> : <EmptyState text="Gere a primeira campanha para começar a comparar as versões A e B." />}</div>
      </div>}

      {data && activeTab === 'assistant' && <div>
        <div className="flex items-start justify-between gap-3"><SectionTitle icon={BrainCircuit} eyebrow="Converse com a sua loja" title="Chat analítico" description="A conversa mantém o contexto, compara os dados reais da loja e considera somente oportunidades futuras quando sugerir novos produtos." />{messages.length ? <button type="button" onClick={clearChat} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600"><Trash2 className="h-4 w-4" />Limpar</button> : null}</div>
        <div className="mt-5 flex flex-wrap gap-2">{['Qual produto devo divulgar hoje e por quê?','Que material devo criar para o próximo mês?','Quais produtos precisam de melhoria primeiro?','Por que posso estar recebendo visitas sem vender?'].map(item => <button key={item} type="button" disabled={asking || typing} onClick={() => void ask(item)} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 disabled:opacity-50">{item}</button>)}</div>
        <div className="mt-5 max-h-[34rem] space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">{messages.length ? messages.map(message => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[92%] rounded-2xl p-4 text-sm leading-7 shadow-sm sm:max-w-[82%] ${message.role === 'user' ? 'bg-blue-700 text-white' : 'border border-violet-100 bg-white text-slate-700'}`}><div className="mb-2 flex items-center justify-between gap-5"><strong className={`text-xs uppercase tracking-wider ${message.role === 'user' ? 'text-blue-100' : 'text-violet-800'}`}>{message.role === 'user' ? 'Você' : 'Agente Eduardo'}</strong>{message.role === 'assistant' && message.content ? <button type="button" onClick={() => copy(message.content)} className="inline-flex items-center gap-1 text-[11px] font-black text-violet-700"><Clipboard className="h-3 w-3" />Copiar</button> : null}</div>{message.content ? <p className="whitespace-pre-line">{message.content}</p> : <p className="flex items-center gap-1 font-bold text-violet-700"><span className="animate-pulse">●</span><span className="animate-pulse [animation-delay:150ms]">●</span><span className="animate-pulse [animation-delay:300ms]">●</span></p>}</div></div>) : <div className="py-10 text-center"><BrainCircuit className="mx-auto h-9 w-9 text-violet-400" /><p className="mt-3 text-sm font-bold text-slate-700">Comece uma conversa sobre sua loja</p><p className="mt-1 text-xs text-slate-500">O histórico ficará disponível neste navegador para continuar a análise.</p></div>}{asking ? <div className="flex items-center gap-2 text-xs font-bold text-violet-700"><Loader2 className="h-4 w-4 animate-spin" />Buscando e analisando todos os produtos publicados...</div> : null}<div ref={chatEndRef} /></div>
        <div className="mt-3 rounded-2xl border border-slate-200 p-4"><textarea value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(); } }} className="min-h-24 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-blue-500" placeholder="Continue a conversa sobre sua loja..." /><div className="mt-3 flex items-center justify-between gap-3"><p className="hidden text-[11px] text-slate-500 sm:block">Enter envia · Shift + Enter quebra a linha</p><button type="button" onClick={() => void ask()} disabled={asking || typing || !question.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white disabled:opacity-60">{asking || typing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareMore className="h-4 w-4" />}{asking ? 'Analisando...' : typing ? 'Digitando...' : 'Enviar mensagem'}</button></div></div>
      </div>}
    </div>
  </section>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-white/10 p-3 backdrop-blur"><p className="text-[10px] font-black uppercase tracking-wider text-blue-100">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>; }
function SmallMetric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-slate-50 p-2"><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 font-black text-slate-800">{value}</p></div>; }
function EmptyState({ text }: { text: string }) { return <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center text-sm text-slate-500">{text}</div>; }
function SectionTitle({ icon: Icon, eyebrow, title, description }: { icon: any; eyebrow: string; title: string; description: string }) { return <div className="flex items-start gap-3"><span className="rounded-xl bg-blue-100 p-2 text-blue-700"><Icon className="h-5 w-5" /></span><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">{eyebrow}</p><h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div></div>; }
function FunctionInfo({ title, text }: { title: string; text: string }) { return <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><p className="text-sm font-black text-blue-950">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div>; }

function CampaignPackView({ pack, copy }: { pack: CampaignPack; copy: (text?: string) => void }) {
  const channels = [{ title: 'WhatsApp', text: pack.whatsapp }, { title: 'Instagram', text: pack.instagram }, { title: `E-mail${pack.email?.subject ? ` — ${pack.email.subject}` : ''}`, text: pack.email?.body }];
  return <div className="space-y-5 rounded-3xl border border-violet-100 bg-violet-50/40 p-4 sm:p-6"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h3 className="text-lg font-black text-slate-950">{pack.campaignName || 'Campanha pronta'}</h3></div>{pack.trackingReady === false && pack.trackingNotice ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">{pack.trackingNotice}</p> : null}<div className="grid gap-4 lg:grid-cols-3">{channels.map(channel => <article key={channel.title} className="flex min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm"><h4 className="font-black text-slate-900">{channel.title}</h4><p className="mt-3 line-clamp-6 whitespace-pre-line text-xs leading-5 text-slate-600">{channel.text}</p><button type="button" onClick={() => copy(channel.text)} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-black text-white"><Clipboard className="h-3.5 w-3.5" />Copiar</button></article>)}</div>{pack.adTitles?.length ? <div><h4 className="font-black text-slate-950">Títulos para anúncios</h4><div className="mt-3 flex flex-wrap gap-2">{pack.adTitles.map(title => <button key={title} type="button" onClick={() => copy(title)} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">{title}</button>)}</div></div> : null}<div className="grid gap-4 lg:grid-cols-2">{[pack.variantA, pack.variantB].map((variant, index) => <article key={index} className={`rounded-2xl border p-5 ${index === 0 ? 'border-blue-200 bg-blue-50' : 'border-fuchsia-200 bg-fuchsia-50'}`}><div className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-violet-700" /><p className="text-xs font-black uppercase tracking-wider text-violet-700">Versão {index === 0 ? 'A · benefício pedagógico' : 'B · economia de tempo'}</p></div><h4 className="mt-3 font-black text-slate-950">{variant?.headline}</h4><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{variant?.message}</p><button type="button" onClick={() => copy(variant?.message)} className="mt-4 rounded-xl bg-violet-700 px-4 py-2 text-xs font-black text-white">Copiar versão {index === 0 ? 'A' : 'B'}</button></article>)}</div>{pack.plan?.length ? <div><h4 className="font-black text-slate-950">Plano de divulgação de sete dias</h4><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{pack.plan.map(item => <div key={`${item.day}-${item.channel}`} className="rounded-xl bg-white p-3"><p className="text-xs font-black text-blue-700">DIA {item.day} · {item.channel}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.action}</p></div>)}</div></div> : null}{pack.stories?.length ? <div><h4 className="font-black text-slate-950">Sequência de Stories</h4><div className="mt-3 grid gap-3 sm:grid-cols-3">{pack.stories.map((story, index) => <button key={`${index}-${story}`} type="button" onClick={() => copy(story)} className="rounded-xl bg-white p-4 text-left text-xs leading-5 text-slate-700 shadow-sm"><strong className="block text-violet-700">Story {index + 1}</strong><span className="mt-2 block">{story}</span></button>)}</div></div> : null}</div>;
}
