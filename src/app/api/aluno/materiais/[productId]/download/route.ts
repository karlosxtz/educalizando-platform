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

    // 1. Verificação de Autenticação do Aluno
    const authSession = await getAuthenticatedUserRole();
    if (!authSession.isAuthenticated || !authSession.userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado. Faça login com sua conta de Aluno.' },
        { status: 401 }
      );
    }

    if (authSession.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Apenas contas de ALUNO possuem autorização para baixar materiais didáticos.' },
        { status: 403 }
      );
    }

    // 2. Validação do Vínculo de Compra (student_product_access)
    const hasAccess = await checkStudentProductAccess({
      studentId: authSession.userId,
      productId
    });

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Você não possui autorização ou compra confirmada para este material.' },
        { status: 403 }
      );
    }

    // 3. Buscar Dados do Produto no Banco
    let productTitle = 'Material Didatico Educalizando';
    let fileUrl: string | null = null;
    let fileExt = 'pdf';

    try {
      const { data: prod } = await supabase
        .from('products')
        .select('titulo, arquivo_url')
        .eq('id', productId)
        .single();

      if (prod) {
        if (prod.titulo) productTitle = prod.titulo;
        if (prod.arquivo_url) {
          fileUrl = prod.arquivo_url;
          const match = fileUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/);
          if (match && match[1]) {
            fileExt = match[1].toLowerCase();
          }
        }
      }
    } catch (e) {
      console.warn('[Download API] Aviso ao consultar dados do produto:', e);
    }

    const humanFilename = sanitizeFilename(productTitle, fileExt);

    // 4. Buscar e Servir o Arquivo Real do Storage caso exista
    if (fileUrl && fileUrl.startsWith('http')) {
      try {
        const fileRes = await fetch(fileUrl);
        if (fileRes.ok) {
          const arrayBuffer = await fileRes.arrayBuffer();
          const contentType = fileRes.headers.get('content-type') || 'application/pdf';

          return new Response(arrayBuffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${humanFilename}"; filename*=UTF-8''${encodeURIComponent(humanFilename)}`,
              'Cache-Control': 'no-store, private'
            }
          });
        }
      } catch (errFetch) {
        console.error('[Download API] Erro ao buscar arquivo do storage:', errFetch);
      }
    }

    // 5. Fallback PDF seguro se o arquivo ainda não tiver URL pública configurada
    const pdfContent = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /Resources <<>> /Contents 4 0 R>> endobj
4 0 obj <</Length 140>> stream
BT /F1 18 Tf 50 750 TD (Educalizando - ${productTitle.substring(0, 45)}) Tj ET
BT /F1 11 Tf 50 710 TD (Material Didatico Digital - Download Direto) Tj ET
BT /F1 10 Tf 50 680 TD (Liberado para: ${authSession.fullName || authSession.email}) Tj ET
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
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar download do material.' },
      { status: 500 }
    );
  }
}
