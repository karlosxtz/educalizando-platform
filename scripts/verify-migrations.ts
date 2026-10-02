import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const migrationsDir = join(root, 'supabase', 'migrations');
const files = readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort();
const legacyCutoff = '20261001';
const versions = new Set<string>();

assert.ok(files.length > 0, 'A pasta de migrações não pode ficar vazia.');

for (const file of files) {
  const match = file.match(/^(\d{8}|\d{14})_([a-z0-9_]+)\.sql$/);
  assert.ok(match, `Nome de migration inválido: ${file}`);
  const [, version] = match!;

  if (version.length === 8) {
    assert.ok(version <= legacyCutoff, `Nova migration precisa de timestamp UTC com 14 dígitos: ${file}`);
    continue;
  }

  assert.ok(!versions.has(version), `Timestamp de migration repetido: ${version}`);
  versions.add(version);
}

const looseSql = readdirSync(join(root, 'supabase'))
  .filter(name => name.endsWith('.sql'))
  .sort();
const knownLegacyLooseSql = new Set([
  'migrations.sql',
  'migrations_atomic_withdraw.sql',
  'migrations_fix_orders_rls.sql',
  'migrations_fix_product_cascade_deletion.sql',
  'migrations_free_products.sql',
  'migrations_kits.sql',
  'migrations_missing_tables.sql',
  'migrations_notifications.sql',
  'migrations_platform_settings.sql',
  'migrations_platform_tutorials.sql',
  'migrations_plr.sql',
  'migrations_plr_checkout.sql',
  'migrations_plr_license.sql',
  'migrations_plr_price.sql',
  'migrations_product_slugs.sql',
  'migrations_purchases.sql',
  'migrations_security_lockdown.sql',
  'migrations_soft_delete.sql',
  'migrations_storage_privacy.sql',
  'migrations_store_customization.sql',
  'migrations_store_themes.sql',
  'migrations_system_banners.sql',
  'schema_orders_asaas_completo.sql',
]);

assert.deepEqual(looseSql, [...knownLegacyLooseSql].sort(), 'Não adicione SQL solto em supabase/. Use supabase/migrations/.');

console.log(`${files.length} migrations verificadas; novos arquivos exigem timestamp UTC exclusivo de 14 dígitos.`);
