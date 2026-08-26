import { Resend } from 'resend';

// Inicializa a biblioteca da Resend (somente se a chave existir no ambiente)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const DEFAULT_FROM = 'Educalizando <contato@educalizando.com>';

export async function sendWelcomeStudentEmail(params: {
  buyerEmail: string;
  buyerName: string;
}) {
  if (!resend) return;
  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2563eb;">🎉 Seja muito bem-vindo(a) à Educalizando!</h2>
        <p>Olá, ${params.buyerName.split(' ')[0]}!</p>
        <p>Sua conta de aluno foi criada com sucesso. Estamos muito felizes em ter você conosco.</p>
        <div style="margin: 30px 0;">
          <a href="https://educalizando.com/entrar" style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Plataforma</a>
        </div>
        <p>Precisa de ajuda? Fale com nosso suporte oficial no WhatsApp:</p>
        <p><a href="https://wa.me/5521965008441" style="color: #2563eb; font-weight: bold;">(21) 96500-8441</a></p>
      </div>
    `;
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: params.buyerEmail,
      subject: '🎉 Seja muito bem-vindo(a) à Educalizando! Seu acesso foi liberado.',
      html,
    });
  } catch (error) {
    console.error('[Mail Service] Erro ao enviar e-mail:', error);
  }
}

export async function sendWelcomeCreatorEmail(params: {
  producerEmail: string;
  producerName: string;
}) {
  if (!resend) return;
  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #10b981;">🚀 Bem-vindo(a) à Educalizando!</h2>
        <p>Olá, ${params.producerName.split(' ')[0]}!</p>
        <p>Sua conta de criador está ativa. Agora você pode criar sua loja e vender seus materiais.</p>
        <div style="margin: 30px 0;">
          <a href="https://educalizando.com/produtor" style="background-color: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Painel do Criador</a>
        </div>
        <p>Precisa de ajuda? Fale com nosso suporte oficial no WhatsApp:</p>
        <p><a href="https://wa.me/5521965008441" style="color: #10b981; font-weight: bold;">(21) 96500-8441</a></p>
      </div>
    `;
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: params.producerEmail,
      subject: '🚀 Bem-vindo(a) à Educalizando! Sua conta de criador está ativa.',
      html,
    });
  } catch (error) {
    console.error('[Mail Service] Erro ao enviar e-mail:', error);
  }
}

export async function sendWelcomeAffiliateEmail(params: {
  affiliateEmail: string;
  affiliateName: string;
}) {
  if (!resend) return;
  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #8b5cf6;">💸 Bem-vindo(a) ao programa de Afiliados!</h2>
        <p>Olá, ${params.affiliateName.split(' ')[0]}!</p>
        <p>Sua conta de afiliado foi criada. Gere seus links de indicação e comece a lucrar.</p>
        <div style="margin: 30px 0;">
          <a href="https://educalizando.com/afiliados/painel" style="background-color: #8b5cf6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Painel de Afiliado</a>
        </div>
        <p>Dúvidas? Fale com nosso suporte oficial no WhatsApp:</p>
        <p><a href="https://wa.me/5521965008441" style="color: #8b5cf6; font-weight: bold;">(21) 96500-8441</a></p>
      </div>
    `;
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: params.affiliateEmail,
      subject: '💸 Bem-vindo(a) ao programa de Afiliados da Educalizando!',
      html,
    });
  } catch (error) {
    console.error('[Mail Service] Erro ao enviar e-mail:', error);
  }
}

export async function sendSaleConfirmationToBuyer(params: {
  buyerEmail: string;
  buyerName: string;
  orderId: string;
  productTitles: string;
  creatorWhatsapp?: string | null;
}) {
  if (!resend) return;
  
  let supportLink = 'https://wa.me/5521965008441';
  let supportPhone = '(21) 96500-8441 (Suporte Educalizando)';
  
  if (params.creatorWhatsapp && params.creatorWhatsapp.trim() !== '') {
    const cleanPhone = params.creatorWhatsapp.replace(/\\D/g, '');
    supportLink = `https://wa.me/55${cleanPhone}`;
    supportPhone = `${params.creatorWhatsapp} (Suporte do Lojista)`;
  }

  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2563eb;">📦 Compra Aprovada!</h2>
        <p>Olá, ${params.buyerName.split(' ')[0]}!</p>
        <p>Sua compra foi aprovada e seus materiais já estão disponíveis na Educalizando.</p>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Materiais:</strong> ${params.productTitles}</p>
        </div>
        <div style="margin: 30px 0;">
          <a href="https://educalizando.com/aluno/dashboard" style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar meus materiais</a>
        </div>
        <p style="font-size: 14px;"><strong>Precisa de ajuda com o material?</strong><br/>
        Fale com o suporte no WhatsApp: <a href="${supportLink}" style="color: #2563eb; font-weight: bold;">${supportPhone}</a></p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Educalizando - A maior plataforma de materiais didáticos do Brasil.<br/>ID do Pedido: ${params.orderId}</p>
      </div>
    `;

    await resend.emails.send({
      from: DEFAULT_FROM,
      to: params.buyerEmail,
      subject: '📦 Compra Aprovada! Seus materiais da Educalizando já estão disponíveis.',
      html,
    });
  } catch (error) {
    console.error('[Mail Service] Erro ao enviar e-mail de acesso:', error);
  }
}

export async function sendSaleNotificationToCreator(params: {
  producerEmail: string;
  producerName: string;
  amount: number;
  productTitle: string;
  orderId: string;
}) {
  if (!resend) return;

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.amount);

  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #10b981;">💰 Ka-ching! Nova Venda Realizada!</h2>
        <p>Parabéns, ${params.producerName.split(' ')[0]}!</p>
        <p>Você acabou de realizar uma nova venda na Educalizando.</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Produto:</strong> ${params.productTitle}</p>
          <p style="margin: 0; font-size: 24px; color: #047857; font-weight: bold;">Valor Líquido: ${formattedAmount}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Pedido: #${params.orderId}</p>
        </div>
        <div style="margin: 30px 0;">
          <a href="https://educalizando.com/produtor/financeiro" style="background-color: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver meu Painel Financeiro</a>
        </div>
        <p style="font-size: 14px;"><strong>Dúvidas?</strong> Fale com o suporte de criadores: <a href="https://wa.me/5521965008441" style="color: #10b981; font-weight: bold;">(21) 96500-8441</a></p>
      </div>
    `;

    await resend.emails.send({
      from: DEFAULT_FROM,
      to: params.producerEmail,
      subject: '💰 Ka-ching! Você realizou uma nova venda na Educalizando!',
      html,
    });
  } catch (error) {
    console.error('[Mail Service] Erro ao enviar e-mail de venda:', error);
  }
}

export async function sendSaleNotificationToAffiliate(params: {
  affiliateEmail: string;
  affiliateName: string;
  amount: number;
  productTitle: string;
}) {
  if (!resend) return;

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.amount);

  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #8b5cf6;">💸 Oba! Nova Comissão!</h2>
        <p>Olá, ${params.affiliateName.split(' ')[0]}!</p>
        <p>Você recebeu uma nova comissão de afiliado na Educalizando!</p>
        <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Material Indicado:</strong> ${params.productTitle}</p>
          <p style="margin: 0; font-size: 24px; color: #6d28d9; font-weight: bold;">Sua Comissão: ${formattedAmount}</p>
        </div>
        <div style="margin: 30px 0;">
          <a href="https://educalizando.com/afiliados/painel" style="background-color: #8b5cf6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver meu Painel de Afiliado</a>
        </div>
        <p style="font-size: 14px;"><strong>Dúvidas?</strong> Fale com o suporte para afiliados: <a href="https://wa.me/5521965008441" style="color: #8b5cf6; font-weight: bold;">(21) 96500-8441</a></p>
      </div>
    `;

    await resend.emails.send({
      from: DEFAULT_FROM,
      to: params.affiliateEmail,
      subject: '💸 Oba! Você recebeu uma nova comissão de afiliado na Educalizando!',
      html,
    });
  } catch (error) {
    console.error('[Mail Service] Erro ao enviar e-mail de comissão:', error);
  }
}
