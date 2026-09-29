import assert from 'node:assert/strict';
import {
  CREATOR_NETWORKING_PRESETS,
  renderCreatorNetworkingMessage,
  suggestedGreetingPresetId,
} from '../src/lib/creator-networking';

assert.deepEqual(
  CREATOR_NETWORKING_PRESETS.map((preset) => preset.id),
  ['welcome', 'group', 'morning', 'afternoon', 'evening', 'support'],
);
assert.equal(suggestedGreetingPresetId(8), 'morning');
assert.equal(suggestedGreetingPresetId(14), 'afternoon');
assert.equal(suggestedGreetingPresetId(21), 'evening');
assert.equal(
  renderCreatorNetworkingMessage('Olá {{nome}}, sua loja é {{loja}}.', { name: 'Ana', storeName: 'Cantinho da Ana' }),
  'Olá Ana, sua loja é Cantinho da Ana.',
);
assert.ok(CREATOR_NETWORKING_PRESETS.every((preset) => preset.message.length > 30));

console.log('Modelos, personalização e saudação por horário validados.');
