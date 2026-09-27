import assert from 'node:assert/strict';
import { getSearchTerms, normalizeSearchText, searchMatchScore } from '../src/lib/search-matching';

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

console.log('Search matching verification passed.');
