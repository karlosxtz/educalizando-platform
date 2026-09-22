'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error('GLOBAL ERROR CAUGHT:', error);
    headingRef.current?.focus();
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
        <main role="alert" aria-labelledby="global-error-title" style={{ display: 'grid', minHeight: '100dvh', placeItems: 'center', padding: '24px' }}>
          <section style={{ width: '100%', maxWidth: '448px', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '24px', background: '#fff', padding: '32px', textAlign: 'center', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}>
            <div aria-hidden="true" style={{ margin: '0 auto 20px', display: 'grid', height: '56px', width: '56px', placeItems: 'center', borderRadius: '16px', background: '#fff1f2', color: '#be123c', fontSize: '28px' }}>!</div>
            <h1 ref={headingRef} id="global-error-title" tabIndex={-1} style={{ margin: 0, fontSize: '24px', lineHeight: 1.2, outline: 'none' }}>Não foi possível abrir esta página</h1>
            <p style={{ margin: '14px 0 24px', color: '#475569', fontSize: '16px', lineHeight: 1.5 }}>Pode ser uma instabilidade temporária. Tente novamente; se continuar, volte ao início e tente mais tarde.</p>
            <button type="button" onClick={() => reset()} style={{ minHeight: '48px', width: '100%', cursor: 'pointer', border: 0, borderRadius: '12px', background: '#2563eb', color: '#fff', fontSize: '16px', fontWeight: 700 }}>Tentar novamente</button>
            <Link href="/" style={{ display: 'inline-block', marginTop: '18px', color: '#1d4ed8', fontWeight: 700 }}>Voltar ao início</Link>
          </section>
        </main>
      </body>
    </html>
  );
}
