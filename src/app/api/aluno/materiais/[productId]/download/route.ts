import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRequestUser } from '@/lib/api-auth';

function sanitizeFilename(title: string, extension = 'pdf'): string {
  const clean = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${clean || 'material_didatico'}.${extension}`;
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

    // 2. Validação do vínculo pelo servidor, sem depender das permissões do navegador.
    const { data: access } = await supabaseAdmin
      .from('student_product_access')
      .select('order_id')
      .eq('student_id', studentId)
      .eq('product_id', productId)
      .eq('status', 'ACTIVE')
      .limit(1)
      .maybeSingle();
    if (!access) {
      const { data: freeProduct } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('id', productId)
        .eq('is_free', true)
        .eq('status', 'publicado')
        .is('excluido_em', null)
        .maybeSingle();
      if (!freeProduct) {
        console.warn(`[Download API] Acesso pendente de confirmação para produto ${productId}`);
        return NextResponse.json({ error: 'Você não possui acesso a este material.' }, { status: 403 });
      }
    }
    if (access?.order_id) {
      const { data: accessOrder } = await supabaseAdmin
        .from('orders')
        .select('is_plr_purchase, status')
        .eq('id', access.order_id)
        .eq('student_id', studentId)
        .maybeSingle();
      isPlrPurchase = accessOrder?.status === 'paid' && accessOrder?.is_plr_purchase === true;
    }

    // 3. Buscar Dados do Produto ou Conteúdo no Banco Supabase
    let productTitle = 'Material Didatico Educalizando';
    let fileUrl: string | null = null;
    let fileExt = 'pdf';

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const downloadType = searchParams.get('type'); // 'plr' for PLR license

    try {
      if (contentId) {
        const { data: itemData } = await supabaseAdmin
          .from('digital_contents')
          .select('titulo, url, file_name')
          .eq('id', contentId)
          .eq('product_id', productId)
          .maybeSingle();

        if (itemData) {
          if (itemData.titulo) productTitle = itemData.titulo;
          if (itemData.url) fileUrl = itemData.url;
        }
      }

      if (!fileUrl) {
        const { data: productData } = await supabaseAdmin
          .from('products')
          .select('titulo')
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
      let activeUrl = fileUrl;

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

      if (activeUrl.startsWith('https://')) {
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
