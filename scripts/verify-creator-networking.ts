import assert from 'node:assert/strict';
import {
  CREATOR_NETWORKING_PRESETS,
  renderCreatorNetworkingMessage,
  suggestedGreetingPresetId,
  isCreatorNetworkingPresetId,
} from '../src/lib/creator-networking';
import { normalizeWhatsAppNumber, readableEvolutionFailure, whatsappNumberCandidates } from '../src/lib/whatsapp-notification-service';

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
assert.equal(isCreatorNetworkingPresetId('group'), true);
assert.equal(isCreatorNetworkingPresetId('anything-else'), false);

assert.equal(normalizeWhatsAppNumber('(12) 99999-9999'), '5512999999999');
assert.equal(normalizeWhatsAppNumber('+55 (12) 99999-9999'), '5512999999999');
assert.equal(normalizeWhatsAppNumber('0055 12 99999-9999'), '5512999999999');
assert.equal(normalizeWhatsAppNumber('0 (12) 99999-9999'), '5512999999999');
assert.deepEqual(whatsappNumberCandidates('(12) 3456-7890'), ['551234567890', '5512934567890']);
assert.deepEqual(whatsappNumberCandidates('(12) 93456-7890'), ['5512934567890', '551234567890']);
assert.equal(normalizeWhatsAppNumber('(12) 123456'), null);
assert.equal(
  readableEvolutionFailure(403, { message: 'AxiosError: Request failed with status code 403' }, true),
  'A Evolution não conseguiu baixar a imagem anexada. Envie novamente para a plataforma gerar um novo link seguro.',
);
assert.equal(
  readableEvolutionFailure(400, [{ jid: '5512999999999@s.whatsapp.net', exists: false }]),
  'Nenhuma variação válida deste número foi encontrada no WhatsApp.',
);

console.log('Modelos, personalização, saudação e normalização de WhatsApp validados.');
