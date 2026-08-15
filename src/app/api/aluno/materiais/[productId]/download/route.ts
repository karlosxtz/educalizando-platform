import { NextResponse } from 'next/server';
import { getAuthenticatedUserRole, checkStudentProductAccess } from '@/lib/student-service';
import { supabase } from '@/lib/supabase';

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

    // 1. Obter Sessão do Aluno
    const authSession = await getAuthenticatedUserRole();
    const studentId = authSession.userId || 'student-demo';

    // 2. Validação do Vínculo de Compra (se autenticado)
    if (authSession.isAuthenticated) {
      const hasAccess = await checkStudentProductAccess({
        studentId,
        productId
      });

      if (!hasAccess) {
        console.warn(`[Download API] Acesso pendente de confirmação para produto ${productId}`);
      }
    }

    // 3. Buscar Dados do Produto ou Conteúdo no Banco Supabase
    let productTitle = 'Material Didatico Educalizando';
    let fileUrl: string | null = null;
    let fileExt = 'pdf';

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    try {
      if (contentId) {
        const { data: itemData } = await supabase
          .from('digital_contents')
          .select('titulo, url, file_name')
          .eq('id', contentId)
          .single();

        if (itemData) {
          if (itemData.titulo) productTitle = itemData.titulo;
          if (itemData.url) fileUrl = itemData.url;
        }
      }

      if (!fileUrl) {
        const { data: productData } = await supabase
          .from('products')
          .select('titulo, arquivo_url')
          .eq('id', productId)
          .is('excluido_em', null)
          .maybeSingle();

        if (productData) {
          if (productData.titulo) productTitle = productData.titulo;
          if (productData.arquivo_url) fileUrl = productData.arquivo_url;
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

      // Se for caminho relativo do Supabase Storage, gerar Signed URL
      if (!activeUrl.startsWith('http://') && !activeUrl.startsWith('https://')) {
        console.log(`[Download API] Gerando Signed URL para path relativo: ${activeUrl}`);
        try {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('product-files')
            .createSignedUrl(activeUrl, 3600);
            
          if (signedError) {
            console.error('[Download API] Erro ao criar Signed URL no Supabase:', signedError);
          }

          if (signedData?.signedUrl) {
            console.log(`[Download API] Signed URL gerada com sucesso.`);
            activeUrl = signedData.signedUrl;
          } else {
            console.warn(`[Download API] Fallback para getPublicUrl para o arquivo: ${activeUrl}`);
            const { data: pubData } = supabase.storage
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

      if (activeUrl.startsWith('http://') || activeUrl.startsWith('https://')) {
        console.log(`[Download API] Iniciando fetch do arquivo na URL ativa (início: ${activeUrl.substring(0, 30)}...)`);
        try {
          const fileRes = await fetch(activeUrl);
          if (fileRes.ok && fileRes.body) {
            console.log(`[Download API] Fetch OK. Stream iniciado.`);
            const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
            
            return new Response(fileRes.body, {
              headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${humanFilename}"; filename*=UTF-8''${encodeURIComponent(humanFilename)}`,
                'Cache-Control': 'no-store, private',
                'X-Content-Type-Options': 'nosniff'
              }
            });
          } else {
            console.error(`[Download API] Fetch falhou com status ${fileRes.status}: ${fileRes.statusText}`);
          }
        } catch (errFetch) {
          console.error('[Download API] Erro ao fazer fetch/stream do arquivo:', errFetch);
        }
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
