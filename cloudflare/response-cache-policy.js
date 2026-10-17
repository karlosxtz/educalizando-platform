export function mustKeepPrivate(request, response) {
  const pathname = new URL(request.url).pathname;
  return request.method !== 'GET' && request.method !== 'HEAD'
    || request.headers.has('Authorization')
    || request.headers.has('Cookie')
    || request.headers.has('RSC') || request.headers.has('Next-Router-State-Tree')
    || request.headers.get('Accept')?.includes('text/x-component')
    || response.headers.has('Set-Cookie')
    || /^\/(login|entrar|seguranca|redefinir-senha|auth|admin|dashboard|painel|checkout|aluno|cliente|afiliados)(\/|$)/.test(pathname)
    || /^\/loja\/[^/]+\/checkout(\/|$)/.test(pathname)
    || pathname === '/api' || pathname.startsWith('/api/');
}

export function applyResponseCachePolicy(request, response) {
  if (!mustKeepPrivate(request, response)) return response;
  const headers = new Headers(response.headers);
  for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Cloudflare-CDN-Cache-Control']) headers.set(name, 'private, no-store, max-age=0, must-revalidate');
  headers.set('X-Educalizando-Cache-Policy', 'private');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
