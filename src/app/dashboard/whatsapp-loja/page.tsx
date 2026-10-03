'use client';

import CreatorWhatsAppCampaignCenter from '@/components/creator/CreatorWhatsAppCampaignCenter';
import { CheckCircle2,MessageCircle,QrCode,RefreshCw,Send,ShieldCheck,Sparkles,X } from 'lucide-react';
import { useEffect,useState } from 'react';
import { toast } from 'sonner';

type Subscription = { active: boolean; expires_at: string | null; instance_name: string; whatsapp_connected: boolean };
type Access = { active: boolean; source: 'paid' | 'store_bonus' | 'global_free' | 'inactive'; chargeEnabled: boolean; paidActive: boolean; individualFree: boolean };
type Data = { subscription: Subscription | null; access: Access; priceCents: number };
type Connection = { connected: boolean; qrCode: string | null; error?: string };
type ApiPayload = { error?: string; checkoutUrl?: string; connection?: Connection; subscription?: Subscription | null; access?: Access; priceCents?: number };
const read = async (response: Response): Promise<ApiPayload> => response.json().catch(() => ({ error: 'Não foi possível concluir agora. Atualize a página e tente novamente.' }));
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export default function WhatsAppLojaPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);

  const load = async () => {
    try {
      const response = await fetch('/api/creator/whatsapp-module');
      const payload = await read(response);
      if (!response.ok) throw new Error(payload.error);
      if (!payload.access) throw new Error('O estado do módulo não foi informado.');
      setData({ subscription: payload.subscription || null, access: payload.access, priceCents: payload.priceCents || 1990 });
    } catch (error) { toast.error(errorMessage(error, 'Não foi possível carregar o módulo.')); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let mounted = true;
    void fetch('/api/creator/whatsapp-module').then(async (response) => {
      const payload = await read(response);
      if (!response.ok) throw new Error(payload.error);
      if (!payload.access) throw new Error('O estado do módulo não foi informado.');
      if (mounted) setData({ subscription: payload.subscription || null, access: payload.access, priceCents: payload.priceCents || 1990 });
    }).catch((error: unknown) => {
      if (mounted) toast.error(errorMessage(error, 'Não foi possível carregar o módulo.'));
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const buy = async () => {
    setPaying(true);
    try {
      const response = await fetch('/api/creator/whatsapp-module', { method: 'POST' });
      const payload = await read(response);
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || 'O checkout não foi criado.');
      window.location.assign(payload.checkoutUrl);
    } catch (error) { toast.error(errorMessage(error, 'Não foi possível criar o pagamento.')); setPaying(false); }
  };

  const connect = async (force = false) => {
    setConnecting(true);
    try {
      const response = await fetch('/api/creator/whatsapp-module/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force }) });
      const payload = await read(response);
      if (!response.ok || !payload.connection) throw new Error(payload.error || 'A conexão não foi preparada.');
      setConnection(payload.connection);
      if (payload.connection.connected) { toast.success('WhatsApp conectado e automação ativada.'); await load(); }
    } catch (error) { toast.error(errorMessage(error, 'Não foi possível gerar o QR Code.')); }
    finally { setConnecting(false); }
  };

  const active = data?.access.active;
  const accessLabel = data?.access.source === 'store_bonus' ? 'ACESSO CORTESIA' : data?.access.source === 'global_free' ? 'GRÁTIS PARA TODOS' : active ? 'MÓDULO ATIVO' : 'MÓDULO PREMIUM';
  const qrSource = connection?.qrCode ? (connection.qrCode.startsWith('data:') ? connection.qrCode : `data:image/png;base64,${connection.qrCode}`) : null;

  return <div className="mx-auto max-w-7xl space-y-6">
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-7 text-white shadow-xl sm:p-10">
      <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10" />
      <span className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black"><Sparkles className="h-4 w-4" /> {accessLabel}</span>
      <div className="relative mt-4 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end"><div><h1 className="text-3xl font-black sm:text-4xl">Venda e se relacione pelo WhatsApp.</h1><p className="mt-3 max-w-2xl text-base text-emerald-50">Atenda automaticamente, confirme pagamentos e envie campanhas personalizadas aos clientes reais da sua loja.</p></div><div className="rounded-2xl bg-slate-950/25 p-4 text-sm"><b>{active ? 'Comece em 2 passos' : 'Ative em 3 passos'}</b><p className="mt-1 text-emerald-50">{active ? 'Escaneie o QR · Comece a vender' : 'Pague · Escaneie o QR · Comece a vender'}</p></div></div>
    </section>

    {loading ? <div className="rounded-2xl border bg-white p-8 text-center">Carregando...</div> : active ? <ActiveModule data={data!} connecting={connecting} onConnect={() => void connect(false)} /> : <InactiveModule paying={paying} priceCents={data?.priceCents || 1990} onBuy={() => void buy()} />}

    {active && <CreatorWhatsAppCampaignCenter connected={Boolean(data?.subscription?.whatsapp_connected)} />}
    {connection && <ConnectionModal connection={connection} qrSource={qrSource} connecting={connecting} onClose={() => setConnection(null)} onRefresh={() => void connect(true)} />}
  </div>;
}

function ActiveModule({ data, connecting, onConnect }: { data: Data; connecting: boolean; onConnect: () => void }) {
  const subscription = data.subscription;
  const title = data.access.source === 'store_bonus'
    ? 'Acesso cortesia liberado para sua loja'
    : data.access.source === 'global_free'
      ? 'Módulo liberado gratuitamente pela Educalizando'
      : subscription?.expires_at
        ? `Módulo ativo até ${new Date(subscription.expires_at).toLocaleDateString('pt-BR')}`
        : 'Módulo ativo';
  return <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8"><div className="flex gap-3"><CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600" /><div><h2 className="font-black">{title}</h2><p className="mt-1 text-sm text-slate-600">{subscription?.whatsapp_connected ? 'Seu número está conectado. O atendimento e a central de campanhas estão liberados.' : 'Conecte o número da sua loja para liberar atendimento, campanhas e entregas pelo WhatsApp.'}</p>{data.access.source === 'store_bonus' ? <p className="mt-2 text-xs font-bold text-violet-700">Esta cortesia permanece válida enquanto estiver liberada pelo administrador.</p> : null}</div></div><div className="mt-5 flex flex-wrap gap-3"><button onClick={onConnect} disabled={connecting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white disabled:opacity-60"><QrCode className="h-4 w-4" />{connecting ? 'Preparando QR Code...' : subscription?.whatsapp_connected ? 'Ver conexão' : 'Conectar meu WhatsApp'}</button>{subscription?.whatsapp_connected && <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Atendimento e campanhas ativos</span>}</div></section>;
}

function InactiveModule({ paying, priceCents, onBuy }: { paying: boolean; priceCents: number; onBuy: () => void }) {
  const benefits = ['Busca por tema, série e categoria', 'Campanhas para seus clientes', 'Divulgação de produtos com capa', 'Convite para material exclusivo', 'Pagamento e entrega automáticos', 'QR Code e número da sua loja'];
  const price = (priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-3xl border bg-white p-6 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-emerald-600">O que você ganha</p><h2 className="mt-2 text-2xl font-black">Mais vendas. Menos respostas repetidas.</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{benefits.map((item) => <p key={item} className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900"><MessageCircle className="h-4 w-4" />{item}</p>)}</div></div><aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl"><p className="text-sm font-bold text-emerald-300">WHATSAPP DA LOJA</p><p className="mt-3 text-4xl font-black">{price}</p><p className="text-sm text-slate-300">por 30 dias de automação</p><ul className="my-5 space-y-2 text-sm text-slate-200"><li>✓ Assinatura do módulo: {price} a cada 30 dias</li><li>✓ Atendimento automático e campanhas</li><li>✓ Sem assinatura ou cortesia, a comunicação é interrompida</li></ul><button onClick={onBuy} disabled={paying} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-black text-slate-950 disabled:opacity-60"><Send className="h-4 w-4" />{paying ? 'Abrindo pagamento...' : 'Ativar agora'}</button></aside></section>;
}

function ConnectionModal({ connection, qrSource, connecting, onClose, onRefresh }: { connection: Connection; qrSource: string | null; connecting: boolean; onClose: () => void; onRefresh: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"><div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-black">Conecte seu WhatsApp</h2><p className="mt-1 text-sm text-slate-600">No celular, abra WhatsApp › Dispositivos conectados › Conectar dispositivo.</p></div><button onClick={onClose} className="rounded-lg p-1 text-slate-400"><X className="h-5 w-5" /></button></div>{connection.connected ? <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-center text-sm font-bold text-emerald-800">Seu WhatsApp já está conectado.</div> : qrSource ? <><img src={qrSource} alt="QR Code para conectar WhatsApp" className="mx-auto mt-5 h-56 w-56 rounded-xl border bg-white p-2" /><button onClick={onRefresh} disabled={connecting} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-black"><RefreshCw className="h-4 w-4" /> Gerar outro QR Code</button></> : <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{connection.error || 'O QR Code está sendo preparado. Tente novamente em alguns segundos.'}</p>}</div></div>;
}
