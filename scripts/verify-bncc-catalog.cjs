const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const rows = Array.from({ length: 1600 }, (_, index) => ({ id: String(index), code: `EF${String(index).padStart(4, '0')}` }));
rows.push({ id: 'ethics', code: 'EM13CHS501' });
let failAt = Infinity;
const client = { from: table => {
  assert.equal(table, 'bncc_skills');
  return { select: () => ({ order: () => ({ range: async (start, end) => {
    if (start >= failAt) return { data: null, error: { message: 'test failure' } };
    // Simula um limite do servidor menor que o tamanho de página solicitado.
    return { data: rows.slice(start, Math.min(end + 1, start + 200)), error: null };
  } }) }) };
} };
const exportsForTest = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/category-service.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: exportsForTest,
  require: name => { assert.equal(name, './supabase'); return { supabase: client }; },
  process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' } },
  console: { error() {} },
});
(async () => {
  const catalog = await exportsForTest.getBnccSkills();
  assert.equal(catalog.length, rows.length);
  assert.equal(catalog.at(-1).code, 'EM13CHS501');
  assert.equal(new Set(catalog.map(row => row.id)).size, rows.length);
  failAt = 400;
  assert.equal((await exportsForTest.getBnccSkills()).length, 0, 'Não apresentar catálogo parcial após erro');
  console.log('BNCC: catálogo completo além de 1.000 linhas e falha sem dados parciais verificados.');
})().catch(error => { console.error(error); process.exitCode = 1; });
