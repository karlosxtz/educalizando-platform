import assert from 'node:assert/strict';
import {
  CREATOR_WHATSAPP_CAMPAIGN_PRESETS,
  isCreatorWhatsAppCampaignPresetId,
  renderCreatorWhatsAppCampaignMessage,
  suggestedCreatorCampaignPresetId,
} from '../src/lib/creator-whatsapp-campaigns';

assert.deepEqual(
  CREATOR_WHATSAPP_CAMPAIGN_PRESETS.map((preset) => preset.id),
  ['promotion', 'product', 'product_request', 'exclusive', 'morning', 'afternoon', 'evening', 'support'],
);
assert.equal(CREATOR_WHATSAPP_CAMPAIGN_PRESETS.find((preset) => preset.id === 'product')?.requiresProduct, true);
assert.equal(CREATOR_WHATSAPP_CAMPAIGN_PRESETS.find((preset) => preset.id === 'exclusive')?.requiresExclusiveEnabled, true);
assert.equal(isCreatorWhatsAppCampaignPresetId('promotion'), true);
assert.equal(isCreatorWhatsAppCampaignPresetId('unknown'), false);
assert.equal(suggestedCreatorCampaignPresetId(8), 'morning');
assert.equal(suggestedCreatorCampaignPresetId(14), 'afternoon');
assert.equal(suggestedCreatorCampaignPresetId(21), 'evening');
assert.equal(
  renderCreatorWhatsAppCampaignMessage(
    'Olá {{nome}}! {{produto}} custa {{preco}} na {{loja}}: {{link}}',
    { customerName: 'Ana', storeName: 'Cantinho da Ana', productName: 'Alfabeto', productPrice: 'R$ 10,00', link: 'https://example.com' },
  ),
  'Olá Ana! Alfabeto custa R$ 10,00 na Cantinho da Ana: https://example.com',
);
assert.ok(CREATOR_WHATSAPP_CAMPAIGN_PRESETS.every((preset) => preset.message.length > 60));

console.log('Campanhas, modelos e personalização do WhatsApp do criador validados.');

