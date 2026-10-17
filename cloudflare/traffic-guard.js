/** Reject paths this application never serves before loading the framework.
 * This is not a bot classifier, global rate limit or billing cap. */
export function rejectScannerRequest(request) {
  const path = new URL(request.url).pathname;
  if (/(?:^|\/)\.(?:env|git)(?:[/.]|$)/i.test(path) || /^\/(?:wp-admin|wp-login\.php|xmlrpc\.php)(?:\/|$)/i.test(path)) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  return null;
}
