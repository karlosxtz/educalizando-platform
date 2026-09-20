import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRequestUser } from '@/lib/api-auth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createDownloadUrl, isPrivateStorageUri, parsePrivateStorageUri } from '@/lib/object-storage';

function sanitizeFilename(title: string, extension = 'pdf'): string {
  const clean = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${clean || 'material_didatico'}.${extension}`;
}

function wrapText(text: string, maxCharacters = 70) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxCharacters && line) { lines.push(line); line = word; } else line = next;
  });
  if (line) lines.push(line);
  return lines;
}

async function createLicensedPdf(source: Uint8Array, data: { title: string; storeName: string; sellerEmail: string; buyerName: string; buyerEmail: string; buyerPhone: string | null; orderId: string }) {
  const original = await PDFDocument.load(source, { ignoreEncryption: true });
  const output = await PDFDocument.create();
  const page = output.addPage([595.28, 841.89]);
  const bold = await output.embedFont(StandardFonts.HelveticaBold);
  const regular = await output.embedFont(StandardFonts.Helvetica);
  const navy = rgb(0.03, 0.17, 0.39);
  const teal = rgb(0, 0.62, 0.59);
  page.drawRectangle({ x: 0, y: 760, width: 595.28, height: 81.89, color: navy });
  page.drawText('EDUCALIZANDO  |  MATERIAL LICENCIADO', { x: 42, y: 794, size: 15, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Arquivo identificado para uso pessoal do comprador', { x: 42, y: 772, size: 9, font: regular, color: rgb(0.8, 0.92, 1) });
  page.drawText(data.title, { x: 42, y: 710, size: 19, font: bold, color: navy, maxWidth: 510 });
  page.drawRectangle({ x: 42, y: 485, width: 511, height: 170, color: rgb(0.95, 0.98, 0.98), borderColor: rgb(0.72, 0.9, 0.88), borderWidth: 1 });
  page.drawText('DADOS DA LICENÇA', { x: 62, y: 625, size: 11, font: bold, color: teal });
  const rows = [
    ['Loja criadora', data.storeName],
    ['E-mail do criador', data.sellerEmail],
    ['Licenciado para', data.buyerName],
    ['E-mail do comprador', data.buyerEmail],
    ['WhatsApp do comprador', data.buyerPhone || 'Não informado'],
  ];
  let y = 596;
  rows.forEach(([label, value]) => { page.drawText(`${label}:`, { x: 62, y, size: 9, font: bold, color: navy }); page.drawText(value, { x: 202, y, size: 9, font: regular, color: rgb(0.16, 0.22, 0.33), maxWidth: 325 }); y -= 25; });
  page.drawText('Uso autorizado somente para fins pessoais e pedagógicos do comprador.', { x: 42, y: 430, size: 11, font: bold, color: navy });
  const notice = 'Este arquivo contém identificação da licença. Compartilhar, revender, publicar ou distribuir este material sem autorização do criador pode violar os direitos autorais e as condições de uso da compra.';
  let noticeY = 399;
  wrapText(notice).forEach((line) => { page.drawText(line, { x: 42, y: noticeY, size: 10, font: regular, color: rgb(0.25, 0.31, 0.4) }); noticeY -= 17; });
  page.drawLine({ start: { x: 42, y: 130 }, end: { x: 553, y: 130 }, thickness: 1, color: rgb(0.83, 0.87, 0.92) });
  page.drawText(`Pedido ${data.orderId} • Gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'America/Sao_Paulo' }).format(new Date())}`, { x: 42, y: 105, size: 8, font: regular, color: rgb(0.4, 0.46, 0.55) });
  page.drawText('Guarde este documento como comprovante de licença.', { x: 42, y: 88, size: 8, font: regular, color: rgb(0.4, 0.46, 0.55) });
  const pages = await output.copyPages(original, original.getPageIndices());
  pages.forEach((originalPage) => output.addPage(originalPage));
  return output.save();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    // 1. Obter Sessão do Aluno via Cookie Seguro
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Autenticação obrigatória para baixar materiais.' }, { status: 401 });
    }
    const studentId = user.id;
    let isPlrPurchase = false;
    let licenseData = { buyerName: user.user_metadata?.full_name || user.email || 'Comprador', buyerEmail: user.email || '', buyerPhone: null as string | null, orderId: '', storeName: 'Loja parceira Educalizando', sellerEmail: 'Não informado' };

    // 2. Validação do vínculo pelo servidor, sem depender das permissões do navegador.
    const { data: access } = await supabaseAdmin
      .from('student_product_access')
      .select('order_id')
      .eq('student_id', studentId)
      .eq('product_id', productId)
      .eq('status', 'ACTIVE')
      .limit(1)
      .maybeSingle();
    // PLR purchases are creator-to-creator purchases and historically did not
    // always create a student_product_access row. Confirm the paid order and
    // its line item as a fallback, while keeping the product-level check.
    let accessOrderId = access?.order_id || null;
    if (!accessOrderId) {
      const { data: plrOrders } = await supabaseAdmin
        .from('orders')
        .select('id, is_plr_purchase, status, buyer_name, buyer_email, buyer_phone, store_id')
        .eq('student_id', studentId)
        .eq('is_plr_purchase', true)
        .eq('status', 'paid');
      const orderIds = (plrOrders || []).map(order => order.id);
      if (orderIds.length) {
        const { data: matchingItems } = await supabaseAdmin
          .from('order_items')
          .select('order_id')
          .in('order_id', orderIds)
          .eq('product_id', productId)
          .limit(1);
        accessOrderId = matchingItems?.[0]?.order_id || null;
      }
    }
    if (!access && !accessOrderId) {
      console.warn(`[Download API] Acesso pendente de confirmação para produto ${productId}`);
      return NextResponse.json({ error: 'Você não possui acesso a este material.' }, { status: 403 });
    }
    if (accessOrderId) {
      const { data: accessOrder } = await supabaseAdmin
        .from('orders')
        .select('id, is_plr_purchase, status, buyer_name, buyer_email, buyer_phone, store_id')
        .eq('id', accessOrderId)
        .eq('student_id', studentId)
        .maybeSingle();
      isPlrPurchase = accessOrder?.status === 'paid' && accessOrder?.is_plr_purchase === true;
      if (accessOrder) {
        licenseData = { ...licenseData, buyerName: accessOrder.buyer_name || licenseData.buyerName, buyerEmail: accessOrder.buyer_email || licenseData.buyerEmail, buyerPhone: accessOrder.buyer_phone || null, orderId: accessOrder.id || accessOrderId };
        const { data: store } = await supabaseAdmin.from('stores').select('nome_loja, creator_id').eq('id', accessOrder.store_id).maybeSingle();
        if (store) {
          licenseData.storeName = store.nome_loja || licenseData.storeName;
          const creator = await supabaseAdmin.auth.admin.getUserById(store.creator_id);
          licenseData.sellerEmail = creator.data.user?.email || licenseData.sellerEmail;
        }
      }
    }

    // 3. Buscar Dados do Produto ou Conteúdo no Banco Supabase
    let productTitle = 'Material Didatico Educalizando';
    let fileUrl: string | null = null;
    let fileExt = 'pdf';
    let deliveredContent: { id: string; storeId: string; title: string } | null = null;

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const downloadType = searchParams.get('type'); // 'plr' for PLR license

    try {
      if (contentId) {
        const { data: itemData } = await supabaseAdmin
          .from('digital_contents')
          .select('id, store_id, titulo, url, file_name')
          .eq('id', contentId)
          .eq('product_id', productId)
          .maybeSingle();

        if (itemData) {
          if (itemData.titulo) productTitle = itemData.titulo;
          if (itemData.url) fileUrl = itemData.url;
          deliveredContent = { id: itemData.id, storeId: itemData.store_id, title: itemData.titulo || productTitle };
        }
      }

      if (!fileUrl) {
        const { data: productData } = await supabaseAdmin
          .from('products')
          .select('titulo, store_id')
          .eq('id', productId)
          .is('excluido_em', null)
          .maybeSingle();

        if (productData) {
          if (productData.titulo) productTitle = downloadType === 'plr' ? `${productData.titulo} - Licenca PLR` : productData.titulo;
          const { data: delivery } = await supabaseAdmin
            .from('product_deliveries')
            .select('arquivo_url, plr_license_url')
            .eq('product_id', productId)
            .maybeSingle();
          if (downloadType === 'plr') {
            if (!isPlrPurchase) {
              return NextResponse.json({ error: 'Você não adquiriu a licença PLR deste material.' }, { status: 403 });
            }
            fileUrl = delivery?.plr_license_url || null;
          } else if (delivery?.arquivo_url) {
            fileUrl = delivery.arquivo_url;
            // A entrega principal também é um acesso real, embora não exista
            // como linha em digital_contents. Registramos o evento usando um
            // identificador estável para os indicadores do criador.
            deliveredContent = {
              id: `main-delivery:${productId}`,
              storeId: productData.store_id,
              title: productData.titulo || productTitle
            };
          }
        }
      }

      if (fileUrl) {
        const match = fileUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/);
        if (match && match[1]) {
          fileExt = match[1].toLowerCase();
        }
      }
    } catch (e) {
      console.warn('[Download API] Aviso ao consultar dados do produto/conteudo:', e);
    }

    const humanFilename = sanitizeFilename(productTitle, fileExt);

    // 4. Resolver URL de Download (Suporte para URLs externas, Signed URLs e Supabase Storage)
    if (fileUrl && typeof fileUrl === 'string') {
      if (deliveredContent) {
        const { error: accessEventError } = await supabaseAdmin.from('content_access_events').insert({
          store_id: deliveredContent.storeId,
          customer_id: studentId,
          customer_name: user.user_metadata?.full_name || null,
          customer_email: user.email || null,
          content_id: deliveredContent.id,
          content_title: deliveredContent.title,
          product_id: productId,
          event_type: 'FILE_DOWNLOAD',
        });
        if (accessEventError) return NextResponse.json({ error: 'Não foi possível registrar o download.' }, { status: 500 });
      }
      let activeUrl = fileUrl;

      // Arquivos privados novos ficam no MinIO como minio://bucket/chave.
      // A URL assinada só é criada após validar a compra acima.
      if (isPrivateStorageUri(activeUrl)) {
        const location = parsePrivateStorageUri(activeUrl);
        if (!location) return NextResponse.json({ error: 'Referência de arquivo inválida.' }, { status: 400 });
        activeUrl = await createDownloadUrl(location.bucket, location.key, humanFilename);
      }

      // EXTRAÇÃO CRÍTICA: Se a URL no banco for uma URL pública do próprio Supabase (que falha em buckets privados),
      // extraímos apenas o nome do arquivo para forçar a geração de Signed URL.
      const publicStorageMatch = activeUrl.match(/\/object\/public\/product-files\/(.+)$/);
      if (publicStorageMatch && publicStorageMatch[1]) {
        activeUrl = publicStorageMatch[1];
        console.log(`[Download API] URL pública detectada. Path relativo extraído: ${activeUrl}`);
      }

      // Se for caminho relativo do Supabase Storage, gerar Signed URL
      if (!activeUrl.startsWith('http://') && !activeUrl.startsWith('https://')) {
        console.log(`[Download API] Gerando Signed URL para path relativo: ${activeUrl}`);
        try {
          // CRÍTICO: Devemos usar o supabaseAdmin (Service Role Key) porque o bucket 'product-files' 
          // é privado. O client anon (supabase normal) falhará com "StorageApiError: Object not found"
          // por causa do RLS bloqueando a leitura do bucket, mesmo que o arquivo exista perfeitamente.
          const { data: signedData, error: signedError } = await supabaseAdmin.storage
            .from('product-files')
            .createSignedUrl(activeUrl, 3600, { download: humanFilename });
            
          if (signedError) {
            console.error('[Download API] Erro ao criar Signed URL no Supabase:', signedError);
          }

          if (signedData?.signedUrl) {
            console.log(`[Download API] Signed URL gerada com sucesso.`);
            activeUrl = signedData.signedUrl;
          } else {
            console.warn(`[Download API] Fallback para getPublicUrl para o arquivo: ${activeUrl}`);
            const { data: pubData } = supabaseAdmin.storage
              .from('product-files')
              .getPublicUrl(activeUrl);
            if (pubData?.publicUrl) {
              activeUrl = pubData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('[Download API] Erro ao obter URL do Supabase Storage:', storageErr);
        }
      }

      if (activeUrl.startsWith('https://') || activeUrl.startsWith('http://')) {
        // Links cadastrados pelo criador (ex.: Google Drive) não são arquivos
        // binários da Educalizando. O Drive responde com uma página HTML e não
        // pode passar pelo gerador de PDF licenciado. Redirecionamos o aluno
        // diretamente para o link original, preservando a intenção do criador.
        const isExternalCreatorLink = !/supabase\.co\//i.test(activeUrl) && !activeUrl.includes('arquivos.educalizando.com.br');
        if (isExternalCreatorLink) {
          return NextResponse.redirect(activeUrl);
        }

        if (fileExt === 'pdf') {
          try {
            const originalResponse = await fetch(activeUrl, { cache: 'no-store' });
            if (!originalResponse.ok) throw new Error(`Arquivo indisponível: ${originalResponse.status}`);
            const personalized = await createLicensedPdf(new Uint8Array(await originalResponse.arrayBuffer()), {
              title: productTitle,
              storeName: licenseData.storeName,
              sellerEmail: licenseData.sellerEmail,
              buyerName: licenseData.buyerName,
              buyerEmail: licenseData.buyerEmail,
              buyerPhone: licenseData.buyerPhone,
              orderId: licenseData.orderId || accessOrderId || '',
            });
            const licensedFilename = humanFilename.replace(/\.pdf$/i, '') + '-licenciado.pdf';
            return new NextResponse(personalized.slice().buffer as ArrayBuffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${licensedFilename}"`,
                'Cache-Control': 'private, no-store, max-age=0',
                'X-Content-Type-Options': 'nosniff',
              },
            });
          } catch (watermarkError) {
            console.error('[Download API] Não foi possível personalizar PDF:', watermarkError);
            return NextResponse.json({ error: 'Não foi possível preparar sua cópia licenciada deste PDF. Tente novamente.' }, { status: 502 });
          }
        }
        console.log(`[Download API] Redirecionando cliente para URL assinada: ${activeUrl.substring(0, 60)}...`);
        return NextResponse.redirect(activeUrl);
      }
    } else {
      console.warn(`[Download API] fileUrl invalido ou nulo. fileUrl =`, fileUrl);
    }

    return NextResponse.json(
      { error: 'Arquivo original não encontrado ou não cadastrado pelo criador.' },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('[Download API] Exceção fatal:', err);
    return NextResponse.json({ error: 'Erro interno ao processar o download' }, { status: 500 });
  }
}
