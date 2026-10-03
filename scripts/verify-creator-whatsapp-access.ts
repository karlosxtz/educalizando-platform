import assert from 'node:assert/strict';

import { determineCreatorWhatsAppAccess } from '../src/lib/creator-whatsapp-access-policy';

const now = Date.parse('2026-10-03T12:00:00.000Z');
const future = '2026-11-03T12:00:00.000Z';
const past = '2026-09-03T12:00:00.000Z';

assert.deepEqual(
  determineCreatorWhatsAppAccess({ chargeEnabled: true, status: 'active', expiresAt: future, now }),
  { active: true, source: 'paid', paidActive: true, individualFree: false },
  'Uma assinatura paga válida precisa liberar o módulo.',
);

assert.deepEqual(
  determineCreatorWhatsAppAccess({ chargeEnabled: true, status: 'active', expiresAt: past, now }),
  { active: false, source: 'inactive', paidActive: false, individualFree: false },
  'Uma assinatura vencida precisa bloquear o módulo quando a cobrança está ativa.',
);

assert.equal(
  determineCreatorWhatsAppAccess({ chargeEnabled: false, status: 'inactive', now }).source,
  'global_free',
  'A gratuidade global precisa liberar todas as lojas.',
);

assert.equal(
  determineCreatorWhatsAppAccess({ chargeEnabled: true, freeAccessEnabled: true, status: 'inactive', now }).source,
  'store_bonus',
  'A cortesia individual precisa liberar a loja mesmo sem pagamento.',
);

assert.equal(
  determineCreatorWhatsAppAccess({ chargeEnabled: false, freeAccessEnabled: true, status: 'active', expiresAt: future, now }).source,
  'store_bonus',
  'A cortesia individual deve continuar identificável para o administrador e para o criador.',
);

console.log('Regras de acesso pago, gratuito global, cortesia individual e bloqueio do WhatsApp validadas.');
