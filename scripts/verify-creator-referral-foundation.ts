import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260926_create_creator_referral_program.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

assert.match(sql, /rate_percent NUMERIC\(5, 2\) NOT NULL DEFAULT 3\.00/);
assert.match(sql, /creator_referrals_referred_creator_unique UNIQUE \(referred_creator_id\)/);
assert.match(sql, /creator_referrals_referred_store_unique UNIQUE \(referred_store_id\)/);
assert.match(sql, /referrer_creator_id <> referred_creator_id/);
assert.match(sql, /commission_amount <= platform_fee_amount/);
assert.match(sql, /creator_referral_commissions_order_unique UNIQUE \(order_id\)/);
assert.match(sql, /ALTER TABLE public\.creator_referral_codes ENABLE ROW LEVEL SECURITY/);
assert.match(sql, /Nenhuma política de INSERT\/UPDATE\/DELETE/);
assert.doesNotMatch(sql, /CREATE POLICY[\s\S]{0,120}FOR (INSERT|UPDATE|DELETE|ALL)/i);

console.log('Creator referral foundation: OK (3%, vínculo único, anti-autoindicação, idempotência e RLS).');
