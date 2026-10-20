import assert from 'node:assert/strict';
import { normalizeProductTags } from '../src/lib/product-tags';
import { editableProductUpdates } from '../src/lib/product-update-payload';

assert.deepEqual(
  normalizeProductTags(['jardim, exploradores escola']),
  ['jardim', 'exploradores', 'escola'],
);
assert.deepEqual(
  normalizeProductTags(['Alfabetização', 'alfabetização', '  LEITURA  ']),
  ['alfabetização', 'leitura'],
);
assert.equal(
  normalizeProductTags(Array.from({ length: 51 }, (_, index) => `tag-${index}`)).length,
  50,
);
const fiftyTags = Array.from({ length: 50 }, (_, index) => `tag-${index}`);
assert.deepEqual(normalizeProductTags(fiftyTags), fiftyTags);
assert.deepEqual(editableProductUpdates({ tags: fiftyTags }).tags, fiftyTags);
assert.equal(editableProductUpdates({ tags: [...fiftyTags, 'extra'] }).tags.length, 50);
assert.deepEqual(editableProductUpdates({ tags: ['Leitura', 'leitura', null, 123] }).tags, ['leitura']);
assert(!('tags' in editableProductUpdates({ titulo: 'Manter tags existentes' })));

console.log('Separação, deduplicação e limite das tags validados.');
