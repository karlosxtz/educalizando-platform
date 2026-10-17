import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { loadEnv } from 'vite';
const require = createRequire(import.meta.url);
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
env.NEXT_PUBLIC_SITE_URL = 'https://www.educalizando.com.br';
env.NEXT_PUBLIC_APP_URL = 'https://www.educalizando.com.br';
if (!env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('dummykey')) {
  throw new Error('Build VPS bloqueado: configure a URL e a chave pública reais do Supabase.');
}
if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('sb_publishable_')) {
  let role;
  try { role = JSON.parse(Buffer.from(env.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.')[1], 'base64url').toString()).role; } catch {}
  if (role !== 'anon') throw new Error('Build VPS bloqueado: a chave do navegador precisa ser anon ou publishable.');
}
const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], {
  env: { ...env, NEXT_PHASE: 'phase-production-build', EDUCALIZANDO_NODE_BUILD: '1', NEXT_TELEMETRY_DISABLED: '1' }, stdio: 'inherit',
});
process.exit(result.status ?? 1);
