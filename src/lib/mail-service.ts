import { Resend } from 'resend';

// Inicializa a biblioteca da Resend (somente se a chave existir no ambiente)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const DEFAULT_FROM = 'Educalizando <contato@educalizando.com>';

export async function sendStudentAccessEmail(params: {
  buyerEmail: string;
  buyerName: string;
  orderId: string;
  productTitles: string;
}) {
  if (!resend) {
    console.warn('[Mail Service] RESEND_API_KEY não configurada. E-mail de acesso não enviado para', params.buyerEmail);
    return;
  }

  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2563eb;">Obrigado por sua compra, ${params.buyerName.split(' ')[0]}! 🎉</h2>
        <p>Sua compra foi aprovada e seu material já está disponível na plataforma.</p>
        <p><strong>Materiais adquiridos:</strong><br/>${params.productTitles}</p>
        <div style="margin: 30px 0;">
          <a href="https://educalizando.com/aluno/dashboard" style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar meus materiais</a>
        </div>
        <p style="font-size: 14px; color: #666;">Se você ainda não tem uma senha, basta usar a opção "Esqueci minha senha" no login utilizando este e-mail.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Educalizando - A maior plataforma de materiais didáticos do Brasil.<br/>ID do Pedido: ${params.orderId}</p>
      </div>
    `;

    await resend.emails.send({
      from: DEFAULT_FROM,
      to: params.buyerEmail,
      subject: 'Seu material do Educalizando chegou! 📚',
      html,
    });
    console.log(`[Mail Service] E-mail de acesso enviado com sucesso para ${params.buyerEmail}`);
  } catch (error) {
    console.error('[Mail Service] Erro ao enviar e-mail de acesso:', error);
  }
}

export async function sendProducerSaleEmail(params: {
  producerEmail: string;
  producerName: string;
  amount: number;
  productTitle: string;
}) {
  if (!resend) {
    console.warn('[Mail Service] RESEND_API_KEY não configurada. E-mail de venda não enviado para', params.producerEmail);
    return;
  }

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.amount);

  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #10b981;">Ka-ching! Nova Venda Realizada! 💰</h2>
        <p>Olá, ${params.producerName}!</p>
        <p>Excelente notícia! Você acabou de realizar uma nova venda na plataforma.</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Produto:</strong> ${params.productTitle}</p>
          <p style="margin: 0; font-size: 24px; color: #047857; font-weight: bold;">Valor Líquido: ${formattedAmount}</p>
        </div>
        <p>O saldo já está disponível na sua carteira Educalizando.</p>
        <div style="margin: 30px 0;">
          <a href="https://educalizando.com/produtor/financeiro" style="background-color: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver meu Painel Financeiro</a>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: DEFAULT_FROM,
      to: params.producerEmail,
      subject: `Nova Venda: ${formattedAmount} 🤑`,
      html,
    });
    console.log(`[Mail Service] E-mail de venda enviado com sucesso para ${params.producerEmail}`);
  } catch (error) {
    console.error('[Mail Service] Erro ao enviar e-mail de venda:', error);
  }
}

export async function sendAffiliateCommissionEmail(params: {
  affiliateEmail: string;
  affiliateName: string;
  amount: number;
  productTitle: string;
}) {
  if (!resend) {
    console.warn('[Mail Service] RESEND_API_KEY não configurada. E-mail de comissão não enviado para', params.affiliateEmail);
    return;
  }

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.amount);

  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #8b5cf6;">Sua indicação gerou uma nova Comissão! 🎉</h2>
        <p>Olá, ${params.affiliateName}!</p>
        <p>Alguém comprou um material através do seu link de afiliado!</p>
        <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Material Indicado:</strong> ${params.productTitle}</p>
          <p style="margin: 0; font-size: 24px; color: #6d28d9; font-weight: bold;">Sua Comissão: ${formattedAmount}</p>
        </div>
        <p>O saldo foi creditado na sua carteira e estará disponível para saque assim que o período de garantia expirar.</p>
        <div style="margin: 30px 0;">
          <a href="https://educalizando.com/afiliados/painel" style="background-color: #8b5cf6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver meu Painel de Afiliado</a>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: DEFAULT_FROM,
      to: params.affiliateEmail,
      subject: `Nova Comissão de Afiliado! ${formattedAmount} 🚀`,
      html,
    });
    console.log(`[Mail Service] E-mail de comissão enviado com sucesso para ${params.affiliateEmail}`);
  } catch (error) {
    console.error('[Mail Service] Erro ao enviar e-mail de comissão:', error);
  }
}
