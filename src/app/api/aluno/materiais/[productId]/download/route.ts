import { NextResponse } from 'next/server';
import { getAuthenticatedUserRole, checkStudentProductAccess } from '@/lib/student-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    // 1. Verificação de Autenticação do Aluno (Item 26 da Especificação)
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

    // 2. Proteção contra IDOR e Validação do Vínculo de Compra (student_product_access) (Item 26 & 28)
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

    // 3. Emissão de Conteúdo Seguro / Signed URL Privada
    // Amostra de PDF didático seguro para demonstração protegida
    const dummyPdfContent = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /Resources <<>> /Contents 4 0 R>> endobj
4 0 obj <</Length 68>> stream
BT /F1 24 Tf 100 700 TD (Educalizando - Material Didatico Protegido) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000192 00000 n
trailer <</Size 5 /Root 1 0 R>>
startxref
311
%%EOF`;

    return new Response(dummyPdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="material_educalizando_${productId}.pdf"`,
        'Cache-Control': 'no-store, private'
      }
    });

  } catch (err: any) {
    console.error('[API Download Material Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar download seguro do material.' },
      { status: 500 }
    );
  }
}
