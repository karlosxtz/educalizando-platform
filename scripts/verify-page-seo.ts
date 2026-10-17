import assert from 'node:assert/strict';
import { PAGE_SEO, pageMetadata, shortSeoTitle, productSeoDescription, storeSeoDescription } from '../src/lib/page-seo';

const titles = new Set<string>();
const descriptions = new Set<string>();
let failures = 0;
for (const [path, entry] of Object.entries(PAGE_SEO)) {
  const title = String(pageMetadata(path).title);
  const valid = title.length <= 60 && entry.description.length > 0 && entry.description.length <= 155;
  console.log(`${valid ? 'OK' : 'FAIL'} ${path}: title=${title.length}, description=${entry.description.length}`);
  if (!valid) failures++;
  assert(!titles.has(title), `Título duplicado: ${path}`);
  assert(!descriptions.has(entry.description), `Descrição duplicada: ${path}`);
  titles.add(title); descriptions.add(entry.description);
  assert.equal(pageMetadata(path).alternates?.canonical, new URL(path, 'https://www.educalizando.com.br').href);
}
assert.equal(failures, 0, 'Metadados fora dos limites');
assert.equal(shortSeoTitle('Título '.repeat(40)), 'Título '.repeat(40).trim());
assert.equal(shortSeoTitle('Nome completo da loja sem cortes', ' | Materiais Didáticos | Educalizando'), 'Nome completo da loja sem cortes | Educalizando');
assert.equal(productSeoDescription('Produto', '<p>Curto</p>'), 'Curto');
assert(productSeoDescription('Produto', 'a'.repeat(200)).length <= 155);
const suffix = ' | Materiais Didáticos | Educalizando';
assert.notEqual(shortSeoTitle('Recursos Pedagógicos da Prof', suffix, true), shortSeoTitle('Recursos Pedagógicos da Profª Lia', suffix, true));
for (const name of ['Loja', 'Recursos Pedagógicos da Prof', 'Recursos Pedagógicos da Profª Lia', 'Nome extenso '.repeat(10)]) {
  for (const category of ['Artes', 'Educação Cristã Clássica', 'Datas Comemorativas']) {
    const text = storeSeoDescription(name, 12, category);
    assert(text.includes(name.trim()), 'Nome completo preservado');
    assert(!text.includes('…'));
    assert(text.length <= 155 || name.length > 100);
  }
}
console.log(`${titles.size} páginas com títulos e descrições únicos; canonical e regras dinâmicas validadas.`);

assert.match(storeSeoDescription('Loja', 1, 'Artes'), /1 material didático\./);
assert.match(storeSeoDescription('Loja', 2, 'Artes'), /2 materiais didáticos\./);
