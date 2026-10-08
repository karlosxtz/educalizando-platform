import assert from 'node:assert/strict';
import { PAGE_SEO, pageMetadata, shortSeoTitle, productSeoDescription } from '../src/lib/page-seo';

const titles = new Set<string>();
const descriptions = new Set<string>();
let failures = 0;
for (const [path, entry] of Object.entries(PAGE_SEO)) {
  const title = `${entry.title} | Educalizando`;
  const valid = title.length <= 60 && entry.description.length >= 140 && entry.description.length <= 155;
  console.log(`${valid ? 'OK' : 'FAIL'} ${path}: title=${title.length}, description=${entry.description.length}`);
  if (!valid) failures++;
  assert(!titles.has(title), `Título duplicado: ${path}`);
  assert(!descriptions.has(entry.description), `Descrição duplicada: ${path}`);
  titles.add(title); descriptions.add(entry.description);
  assert.equal(pageMetadata(path).alternates?.canonical, new URL(path, 'https://www.educalizando.com.br').href);
}
assert.equal(failures, 0, 'Metadados fora dos limites');
assert(shortSeoTitle('Título '.repeat(40)).length <= 60);
assert.equal(productSeoDescription('Produto', '<p>Curto</p>'), 'Baixe Produto na Educalizando. Material didático digital para professores e educadores.');
assert.equal(productSeoDescription('Produto', 'a'.repeat(200)).length, 140);
console.log(`${titles.size} páginas com títulos e descrições únicos; canonical e regras dinâmicas validadas.`);
