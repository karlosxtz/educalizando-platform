'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an external service or the console
    console.error('GLOBAL ERROR CAUGHT:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#333' }}>
          <h2 style={{ color: 'red' }}>A Critical Error Occurred</h2>
          <p>Please send this screenshot to the support team:</p>
          <pre style={{ background: '#f4f4f4', padding: '1rem', overflowX: 'auto' }}>
            {error.name}: {error.message}
            {'\n'}
            {error.stack}
          </pre>
          <button onClick={() => reset()} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
