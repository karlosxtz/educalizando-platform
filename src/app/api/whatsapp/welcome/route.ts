import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, name, role } = body;

    if (!phone || !name || !role) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. Necessário: phone, name, role.' },
        { status: 400 }
      );
    }

    // A API Evolution espera números no formato internacional sem o "+"
    // Remove caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Regra de ouro automática: embute prefixo 55 se vier com DDD (10 ou 11) e sem 55.
    if ((cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith('55')) {
      cleanPhone = `55${cleanPhone}`;
    }
    // Se já tiver 12 ou 13 (com 55), ou tamanho diferente, mantemos para a VPS tentar processar ou falhar.

    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'educalizando';
    const baseUrl = 'https://evolutionapi.vps11334.panel.icontainer.net';
    const apikey = process.env.EVOLUTION_API_KEY || '8RJwswdx6aHGinSCXypt5E85Atmrp6XY';
    const url = `${baseUrl}/message/sendText/${instanceName}`;

    const firstName = name.split(' ')[0] || 'Educador(a)';

    // Buscar Configurações Globais (com tratamento de erro silencioso caso a coluna/tabela falhe)
    let settings: any = null;
    try {
      const { data } = await supabaseAdmin.from('platform_settings').select('*').limit(1).single();
      settings = data;
    } catch (err) {
      console.warn('[Evolution API Backend] Aviso: Não foi possível buscar as configurações do banco. Utilizando templates padrão.', err);
    }

    let message = '';
    
    // Fallback constants
    const defaultCreator = `Olá {{nome}}! 👋\n\nQue alegria ter você na Educalizando! Sua loja acaba de nascer e estamos super empolgados para ver seus materiais didáticos transformando salas de aula em todo o Brasil. 🚀\n\nAcesse seu painel agora mesmo para começar a publicar: https://educalizando.com/dashboard/loja\n\nSe precisar de ajuda, conte com a gente! 💙`;
    const defaultStudent = `Oie {{nome}}! 👋\n\nBem-vindo(a) à comunidade Educalizando! 🎉\nEstamos muito felizes em te receber.\n\nAqui você vai encontrar os melhores materiais, atividades e jogos para enriquecer suas aulas e facilitar o seu dia a dia. Tudo pronto para usar!\n\nExplore agora o nosso acervo: https://educalizando.com/buscar\n\nQualquer dúvida, é só chamar! 📚✨`;
    const defaultAffiliate = `Olá {{nome}}! 👋\n\nSeja muito bem-vindo(a) ao time de Afiliados Educalizando! 💰\n\nSua conta está pronta. A partir de agora, você já pode acessar nossa vitrine, gerar seus links exclusivos e começar a indicar os melhores materiais didáticos do mercado para garantir sua comissão.\n\nBora lucrar? Acesse seu painel: https://educalizando.com/dashboard/afiliacoes\n\nSucesso nas indicações! 🚀🤝`;

    if (role === 'creator') {
      message = (settings?.whatsapp_template_creator || defaultCreator).replace(/\{\{nome\}\}/g, firstName);
    } else if (role === 'student') {
      message = (settings?.whatsapp_template_student || defaultStudent).replace(/\{\{nome\}\}/g, firstName);
    } else if (role === 'affiliate') {
      message = (settings?.whatsapp_template_affiliate || defaultAffiliate).replace(/\{\{nome\}\}/g, firstName);
    }

    const payload = {
      number: cleanPhone,
      text: message
    };

    console.log(`[Evolution API Backend] Iniciando disparo:\n- URL: ${url}\n- Telefone Limpo: ${cleanPhone}\n- Perfil: ${role}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey
      },
      body: JSON.stringify(payload)
    });

    console.log(`[Evolution API Backend] Status retornado pela VPS: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errData = await response.text();
      console.error(`[Evolution API Backend] Falha no disparo. Erro recebido da VPS: ${errData}`);
      return NextResponse.json({ error: 'Falha no envio da VPS', details: errData }, { status: response.status });
    } else {
      const successData = await response.json().catch(() => ({}));
      console.log(`[Evolution API Backend] Mensagem enviada com sucesso! Resposta da VPS:`, JSON.stringify(successData));
      return NextResponse.json({ success: true, data: successData }, { status: 200 });
    }

  } catch (error: any) {
    console.error('[Evolution API Backend] Erro catastrófico ao processar disparo:', error);
    return NextResponse.json({ error: 'Erro interno no servidor da Educalizando', details: error.message }, { status: 500 });
  }
}
