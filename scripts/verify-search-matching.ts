import assert from 'node:assert/strict';
import { createSearchScorer, getSearchTerms, normalizeSearchText, searchMatchScore } from '../src/lib/search-matching';

const material = {
  titulo: 'Kit pedagógico para alfabetização',
  descricao: 'Atividades para o Dia da Árvore no ensino fundamental.',
  format_details: 'PDF e PowerPoint',
  tags: ['consciência fonológica', 'formação de palavras'],
  seasonal_tags: ['Dia da Árvore'],
  category: { nome: 'Educação Infantil', slug: 'educacao-infantil' },
};

assert.equal(normalizeSearchText('Dia da Árvore!'), 'dia da arvore');
assert.deepEqual(getSearchTerms('Atividades para o Dia da Árvore'), ['atividades', 'dia', 'arvore']);
assert.ok(searchMatchScore(material, 'alfabetizacao') > 0, 'encontra título sem acento');
assert.ok(searchMatchScore(material, 'arvore') > 0, 'encontra tag e descrição sem acento');
assert.ok(searchMatchScore(material, 'powerpoint') > 0, 'encontra formato declarado');
assert.ok(searchMatchScore(material, 'consciencia fonologica') > 0, 'encontra tags de busca sem acento');
assert.equal(searchMatchScore(material, 'quimica quantica'), 0, 'não inventa associação inexistente');
assert.ok(searchMatchScore(material, 'alfabetizacoa') === 0, 'não aceita duas alterações como correção segura');
assert.ok(searchMatchScore(material, 'alfabetizaca') > 0, 'tolera um caractere ausente');
let reads = 0;
const observed = { ...material };
Object.defineProperty(observed, 'descricao', { get() { reads++; return material.descricao; } });
for (const query of ['alfabetizacao', 'arvore', 'powerpoint', 'quimica quantica', 'alfabetizaca']) {
  const score = createSearchScorer(query);
  reads = 0;
  assert.equal(score(observed), searchMatchScore(material, query));
  for (let i = 0; i < 50; i++) score(observed);
  assert.equal(reads, 1, 'Descrição longa deve ser normalizada apenas uma vez por consulta, incluindo resultados sem correspondência.');
}

console.log('Search matching verification passed.');
