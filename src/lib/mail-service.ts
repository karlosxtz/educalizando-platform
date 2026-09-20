import 'server-only';
import { Resend } from 'resend';

type MailResult = { sent: boolean; id?: string; error?: string };
type BuyerMailParams = { buyerEmail: string; buyerName: string; orderId: string; productTitles: string; products?: Array<{ id: string; title: string; fileUrl?: string | null; fileName?: string | null }>; creatorWhatsapp?: string | null; isPlrPurchase?: boolean };

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.educalizando.com.br').replace(/\/$/, '');
const from = process.env.RESEND_FROM_EMAIL || 'Educalizando <onboarding@resend.dev>';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] || char);
const firstName = (name: string) => escapeHtml(name.trim().split(/\s+/)[0] || 'cliente');
const button = (href: string, label: string, color = '#0f766e') => `<p style="margin:28px 0"><a href="${href}" style="display:inline-block;border-radius:8px;background:${color};padding:13px 20px;color:#fff;font-weight:700;text-decoration:none">${label}</a></p>`;
const layout = (title: string, content: string) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;line-height:1.55"><h2 style="color:#0f766e">${title}</h2>${content}<hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0"><p style="font-size:12px;color:#64748b">Educalizando · Materiais didáticos digitais com acesso seguro.</p></div>`;
const isCreatorExternalLink = (url?: string | null) => /^https:\/\//i.test(url || '') && !/supabase\.co\//i.test(url || '');
const purchaseAccess = (isPlrPurchase?: boolean) => {
  const area = isPlrPurchase ? '/dashboard/plr/comprados' : '/cliente/dashboard';
  const login = isPlrPurchase ? '/dashboard/login' : '/cliente/login';
  return { areaLabel: isPlrPurchase ? 'suas licenças PLR no painel do criador' : 'seus materiais na Área do Cliente', url: `${appUrl}${login}?returnTo=${encodeURIComponent(area)}` };
};

export async function getMailConfiguration() {
  const domain = from.match(/@([^>\s]+)/)?.[1]?.toLowerCase() || null;
  if (!resend || !domain) return { configured: false, from, appUrl, domain, domainStatus: 'not_configured' };
  try {
    const { data, error } = await resend.domains.list();
    if (error) return { configured: true, from, appUrl, domain, domainStatus: 'unknown', domainError: error.message };
    const domainData = data?.data.find(item => item.name.toLowerCase() === domain);
    return { configured: true, from, appUrl, domain, domainStatus: domainData?.status || 'not_found' };
  } catch (error) {
    return { configured: true, from, appUrl, domain, domainStatus: 'unknown', domainError: error instanceof Error ? error.message : 'Não foi possível consultar a Resend.' };
  }
}

async function send(to: string, subject: string, html: string): Promise<MailResult> {
  if (!resend) return { sent: false, error: 'RESEND_API_KEY não configurada no servidor.' };
  if (!to?.includes('@')) return { sent: false, error: 'E-mail do destinatário inválido.' };
  const { data, error } = await resend.emails.send({ from, to, subject, html });
  if (error) { console.error('[Resend]', error); return { sent: false, error: error.message || 'A Resend recusou o envio.' }; }
  return { sent: true, id: data?.id };
}

export async function sendWelcomeStudentEmail({ buyerEmail, buyerName }: { buyerEmail: string; buyerName: string }) {
  return send(buyerEmail, 'Boas-vindas à Educalizando — seu acesso está pronto', layout('🎉 Boas-vindas à Educalizando!', `<p>Olá, ${firstName(buyerName)}!</p><p>Sua conta de cliente foi criada com sucesso. Entre para conhecer seus materiais e acompanhar suas compras.</p>${button(`${appUrl}/login`, 'Acessar minha conta', '#2563eb')}`));
}
export async function sendWelcomeCreatorEmail({ producerEmail, producerName }: { producerEmail: string; producerName: string }) {
  return send(producerEmail, 'Boas-vindas à Educalizando — sua loja está pronta', layout('🚀 Sua conta de criador está ativa!', `<p>Olá, ${firstName(producerName)}!</p><p>Agora você pode configurar sua loja, publicar materiais e acompanhar suas vendas.</p>${button(`${appUrl}/dashboard`, 'Abrir painel do criador')}`));
}
export async function sendWelcomeAffiliateEmail({ affiliateEmail, affiliateName }: { affiliateEmail: string; affiliateName: string }) {
  return send(affiliateEmail, 'Boas-vindas ao programa de afiliados', layout('💸 Bem-vindo(a) ao programa de afiliados!', `<p>Olá, ${firstName(affiliateName)}!</p><p>Sua conta está pronta para você criar links e acompanhar as comissões.</p>${button(`${appUrl}/afiliados/painel`, 'Abrir painel de afiliado', '#7c3aed')}`));
}

const productsBox = (titles: string, products?: BuyerMailParams['products'], isPlrPurchase?: boolean) => {
  const items = products?.length
    ? `<ul style="margin:10px 0 0;padding-left:20px">${products.map(item => `<li style="margin:5px 0">${escapeHtml(item.title)}</li>`).join('')}</ul>`
    : `<br>${escapeHtml(titles)}`;
  return `<div style="background:#f0fdfa;border:1px solid #99f6e4;padding:16px;border-radius:10px"><strong>${isPlrPurchase ? 'Licenças PLR da compra:' : 'Materiais da compra:'}</strong>${items}</div>`;
};
const creatorLinksBox = (products?: BuyerMailParams['products'], isPlrPurchase?: boolean) => {
  const links = (products || []).filter(item => isCreatorExternalLink(item.fileUrl));
  if (!links.length) return '';
  const heading = isPlrPurchase ? 'Links da licença PLR:' : 'Links liberados pelo criador:';
  return `<div style="margin-top:16px;background:#eff6ff;border:1px solid #bfdbfe;padding:16px;border-radius:10px"><strong>${heading}</strong>${links.map(item => `<p style="margin:12px 0 0"><a href="${escapeHtml(item.fileUrl!)}" style="color:#1d4ed8;font-weight:700">Abrir ${escapeHtml(item.title)} ↗</a></p>`).join('')}</div>`;
};
export async function sendPaymentConfirmedEmail(params: BuyerMailParams) {
  return send(params.buyerEmail, 'Pagamento aprovado — sua compra foi confirmada', layout('✅ Pagamento aprovado!', `<p>Olá, ${firstName(params.buyerName)}!</p><p>Recebemos a confirmação do pagamento do pedido <strong>#${escapeHtml(params.orderId)}</strong>.</p>${productsBox(params.productTitles, params.products, params.isPlrPurchase)}<p>Em seguida, você receberá o e-mail com o acesso aos materiais.</p>`));
}
export async function sendMaterialDeliveryEmail(params: BuyerMailParams) {
  const access = purchaseAccess(params.isPlrPurchase);
  const phone = params.creatorWhatsapp?.replace(/\D/g, '');
  const help = phone ? `<p>Precisa de ajuda? <a href="https://wa.me/55${phone}">Fale com o criador pelo WhatsApp</a>.</p>` : '';
  // Não anexe URLs cadastradas pelo criador diretamente. Uma URL pode apontar
  // para uma página HTML de login/compartilhamento (Drive, Storage privado etc.)
  // e chegar ao comprador como "arquivo" inválido. A biblioteca valida o acesso,
  // resolve a URL correta e prepara o download licenciado do material real.
  return send(params.buyerEmail, 'Seus materiais já estão disponíveis para acesso', layout('📚 Seus materiais estão liberados!', `<p>Olá, ${firstName(params.buyerName)}!</p><p>O acesso foi liberado para ${access.areaLabel}.</p>${productsBox(params.productTitles, params.products, params.isPlrPurchase)}${creatorLinksBox(params.products, params.isPlrPurchase)}${button(access.url, params.isPlrPurchase ? 'Acessar licenças PLR' : 'Acessar meus materiais', '#2563eb')}<p style="font-size:13px;color:#475569">Links externos cadastrados pelo criador são enviados como link. Arquivos hospedados na Educalizando continuam protegidos pela biblioteca.</p>${help}`));
}
/** Reenvio manual solicitado pelo criador para materiais já comprados. */
export async function sendAccessResendEmail(params: BuyerMailParams) {
  const access = purchaseAccess(params.isPlrPurchase);
  const phone = params.creatorWhatsapp?.replace(/\D/g, '');
  const help = phone ? `<p>Precisa de ajuda? <a href="https://wa.me/55${phone}">Fale com o criador pelo WhatsApp</a>.</p>` : '';
  return send(
    params.buyerEmail,
    'Reenvio de acesso — seus materiais Educalizando',
    layout(
      '📚 Seu acesso foi reenviado',
      `<p>Olá, ${firstName(params.buyerName)}!</p><p>Recebemos uma solicitação de reenvio de acesso para os materiais abaixo. Eles continuam liberados em ${access.areaLabel}.</p>${productsBox(params.productTitles, params.products, params.isPlrPurchase)}${creatorLinksBox(params.products, params.isPlrPurchase)}${button(access.url, params.isPlrPurchase ? 'Abrir licenças PLR' : 'Abrir minha biblioteca', '#2563eb')}<p style="font-size:13px;color:#475569">Se o criador cadastrou um link externo, ele está disponível acima. Materiais protegidos pela Educalizando ficam disponíveis pela biblioteca.</p>${help}`
    )
  );
}
export async function sendSaleConfirmationToBuyer(params: BuyerMailParams) {
  const [payment, delivery] = await Promise.all([sendPaymentConfirmedEmail(params), sendMaterialDeliveryEmail(params)]);
  return { sent: payment.sent && delivery.sent, error: payment.error || delivery.error };
}
export async function sendSaleNotificationToCreator({ producerEmail, producerName, amount, productTitle, orderId }: { producerEmail: string; producerName: string; amount: number; productTitle: string; orderId: string }) {
  const amountText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  return send(producerEmail, '💰 Nova venda confirmada na sua loja', layout('💰 Você realizou uma nova venda!', `<p>Parabéns, ${firstName(producerName)}!</p><p>O pagamento do pedido <strong>#${escapeHtml(orderId)}</strong> foi confirmado.</p><p><strong>Produto:</strong> ${escapeHtml(productTitle)}<br><strong>Valor líquido:</strong> ${amountText}</p>${button(`${appUrl}/dashboard/pedidos`, 'Ver pedidos')}`));
}
export async function sendSaleNotificationToAffiliate({ affiliateEmail, affiliateName, amount, productTitle }: { affiliateEmail: string; affiliateName: string; amount: number; productTitle: string }) {
  const amountText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  return send(affiliateEmail, '💸 Nova comissão de afiliado', layout('💸 Você recebeu uma comissão!', `<p>Olá, ${firstName(affiliateName)}!</p><p><strong>Material:</strong> ${escapeHtml(productTitle)}<br><strong>Comissão:</strong> ${amountText}</p>${button(`${appUrl}/afiliados/painel`, 'Ver comissões', '#7c3aed')}`));
}
export async function sendAutomationTestEmail(to: string, name: string) {
  return send(to, '[Teste] Automação de e-mail Educalizando', layout('🧪 Teste enviado com sucesso', `<p>Olá, ${firstName(name)}!</p><p>Se este e-mail chegou, a integração com a Resend está funcionando corretamente.</p>`));
}
