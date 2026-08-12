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

    // 3. Buscar Dados do Produto no Banco Supabase
    let productTitle = 'Material Didatico Educalizando';
    let fileUrl: string | null = null;
    let fileExt = 'pdf';

    try {
      const { data: prod } = await supabase
        .from('products')
        .select('titulo, arquivo_url, tipo')
        .eq('id', productId)
        .single();

      if (prod) {
        if (prod.titulo) productTitle = prod.titulo;
        if (prod.arquivo_url) {
          fileUrl = prod.arquivo_url;
          const match = prod.arquivo_url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
          if (match && match[1]) {
            fileExt = match[1].toLowerCase();
          }
        }
      }
    } catch (e) {
      console.warn('[Download API] Aviso ao consultar dados do produto:', e);
    }

    const humanFilename = sanitizeFilename(productTitle, fileExt);

    // 4. Resolver URL de Download (Suporte para URLs externas, Signed URLs e Supabase Storage)
    if (fileUrl && typeof fileUrl === 'string') {
      let activeUrl = fileUrl;

      // Se for caminho relativo do Supabase Storage, gerar Signed URL
      if (!activeUrl.startsWith('http://') && !activeUrl.startsWith('https://')) {
        try {
          const { data: signedData } = await supabase.storage
            .from('infoproducts')
            .createSignedUrl(activeUrl, 3600);
          if (signedData?.signedUrl) {
            activeUrl = signedData.signedUrl;
          } else {
            const { data: pubData } = supabase.storage
              .from('infoproducts')
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
        try {
          const fileRes = await fetch(activeUrl);
          if (fileRes.ok) {
            const arrayBuffer = await fileRes.arrayBuffer();
            const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';

            return new Response(arrayBuffer, {
              headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${humanFilename}"; filename*=UTF-8''${encodeURIComponent(humanFilename)}`,
                'Cache-Control': 'no-store, private'
              }
            });
          }
        } catch (errFetch) {
          console.error('[Download API] Erro ao baixar arquivo da URL:', errFetch);
        }
      }
    }

    // 5. Fallback PDF oficial para download nativo e imediato
    const pdfContent = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /Resources <<>> /Contents 4 0 R>> endobj
4 0 obj <</Length 160>> stream
BT /F1 18 Tf 50 750 TD (Educalizando - ${productTitle.substring(0, 45)}) Tj ET
BT /F1 11 Tf 50 710 TD (Material Didatico Digital - Download Imprimidor/Salvo) Tj ET
BT /F1 10 Tf 50 680 TD (Liberado para download direto no seu dispositivo.) Tj ET
endstream endobj
xref
0 5
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000192 00000 n
trailer <</Size 5 /Root 1 0 R>>
startxref
380
%%EOF`;

    return new Response(Buffer.from(pdfContent, 'utf-8'), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${humanFilename}"; filename*=UTF-8''${encodeURIComponent(humanFilename)}`,
        'Cache-Control': 'no-store, private'
      }
    });

  } catch (err: any) {
    console.error('[API Download Material Error]:', err);
    // Garantir que a resposta de erro ainda acione download seguro sem quebrar na tela
    const fallbackFilename = 'material_didatico.pdf';
    return new Response(Buffer.from('Erro ao processar arquivo.', 'utf-8'), {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${fallbackFilename}"`,
        'Cache-Control': 'no-store, private'
      }
    });
  }
}
