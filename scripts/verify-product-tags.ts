import assert from 'node:assert/strict';
import { normalizeProductTags } from '../src/lib/product-tags';

assert.deepEqual(
  normalizeProductTags(['jardim, exploradores escola']),
  ['jardim', 'exploradores', 'escola'],
);
assert.deepEqual(
  normalizeProductTags(['Alfabetização', 'alfabetização', '  LEITURA  ']),
  ['alfabetização', 'leitura'],
);
assert.equal(
  normalizeProductTags(Array.from({ length: 15 }, (_, index) => `tag-${index}`)).length,
  10,
);

console.log('Separação, deduplicação e limite das tags validados.');
