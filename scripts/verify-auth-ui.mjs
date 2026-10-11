import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
const storageKey = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321').hostname.split('.')[0]}-auth-token`;
const origin = process.env.AUTH_TEST_ORIGIN || 'http://127.0.0.1:3001';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Este teste usa apenas um servidor local e dados simulados.');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const uid = '11111111-1111-4111-8111-111111111111';
const fid = '22222222-2222-4222-8222-222222222222';
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'teste@example.com', created_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], factors: [{ id: fid, factor_type: 'totp', status: 'verified', friendly_name: 'Teste local', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }] };
const token = aal => [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600, aal, amr: [] })).toString('base64url'), 'local-test-signature'].join('.');
const session = aal => ({ access_token: token(aal), refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user });
let testPage;
try {
  // O endpoint fictício local não faz parte da CSP de produção.
  const context = await browser.newContext({ bypassCSP: true });
  await context.addInitScript(({ data, key }) => { localStorage.setItem(key, JSON.stringify(data)); }, { data: session('aal1'), key: storageKey });
  const page = await context.newPage();
  testPage = page;
  page.on('pageerror', error => console.error('Erro da interface:', error.message));
  page.on('console', message => { if (message.type() === 'error') console.error('Navegador:', message.text().slice(0, 400)); });
  let attempted = 0;
  await page.route('**/auth/v1/**', async route => {
    const url = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': origin, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const send = (body, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname.endsWith('/settings')) return send({ external: { google: false, phone: false } });
    if (url.pathname.endsWith('/user')) return send(user);
    if (url.pathname.endsWith('/challenge')) return send({ id: 'challenge-local', expires_at: Math.floor(Date.now() / 1000) + 300 });
    if (url.pathname.endsWith('/verify')) {
      attempted++;
      const data = route.request().postDataJSON();
      return data.code === '123456' ? send(session('aal2')) : send({ code: 'mfa_verification_failed', msg: 'Código inválido' }, 400);
    }
    return send({ msg: 'Operação inesperada no teste local' }, 400);
  });
  await page.route('**/api/auth/sync', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
  const initial = session('aal1');
  const hash = new URLSearchParams({ access_token: initial.access_token, refresh_token: initial.refresh_token, expires_in: '3600', token_type: 'bearer' });
  await page.goto(`${origin}/seguranca#${hash}`);
  await page.getByRole('heading', { name: 'Segurança da conta' }).waitFor();
  await page.getByText('Proteção ativa: Teste local').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Salvar nova senha' }).isDisabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Remover proteção' }).isDisabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Conectar conta Google' }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Enviar SMS' }).count(), 0);
  await page.getByLabel('Código do aplicativo', { exact: true }).fill('999999');
  await page.getByRole('button', { name: 'Confirmar código', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Código inválido' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Salvar nova senha' }).isDisabled(), true);
  await page.getByLabel('Código do aplicativo', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Confirmar código', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Identidade confirmada' }).waitFor();
  await expect(page.getByRole('button', { name: 'Salvar nova senha' })).toBeEnabled();
  assert.equal(attempted, 2);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '.cloudflare/security-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '.cloudflare/security-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.goto(`${origin}/login`);
  await page.getByText('Outras formas de acessar', { exact: true }).waitFor();
  await page.screenshot({ path: '.cloudflare/login-mobile.png', fullPage: true });
  await context.close();
  console.log('Interface validada: MFA bloqueia alterações, rejeita código errado, libera após confirmar e oculta Google/SMS não configurados. Nenhum e-mail/SMS enviado.');
} catch (error) {
  if (testPage) { await testPage.screenshot({ path: '.cloudflare/auth-ui-failure.png' }); console.error((await testPage.locator('main').innerText()).slice(0, 1400)); console.log('Chaves locais:', await testPage.evaluate(() => Object.keys(localStorage))); }
  throw error;
} finally { await browser.close(); }
