import assert from 'node:assert/strict';
import { safeAuthDestination } from '../src/lib/auth-navigation';
import { requiresSecondFactor } from '../src/lib/auth-assurance';

for (const unsafe of ['https://evil.example', '//evil.example', '/\\evil.example', '/\t/evil.example', '/\n/evil.example', 'javascript:alert(1)', '', null]) {
  assert.equal(safeAuthDestination(unsafe, '/dashboard'), '/dashboard', `Destino não confiável: ${unsafe}`);
}
assert.equal(safeAuthDestination('/loja/minha-loja/checkout?produto=abc'), '/loja/minha-loja/checkout?produto=abc');
assert.equal(safeAuthDestination('/cliente/materiais'), '/cliente/materiais');
const protectedFactors = [{ status: 'verified' }];
assert.equal(requiresSecondFactor(protectedFactors, 'aal1'), true, 'Login por senha não pode ignorar MFA.');
assert.equal(requiresSecondFactor(protectedFactors, undefined), true, 'Claim ausente deve exigir confirmação.');
assert.equal(requiresSecondFactor(protectedFactors, 'aal2'), false);
assert.equal(requiresSecondFactor([{ status: 'unverified' }], 'aal1'), false, 'Configuração incompleta não pode bloquear o usuário.');
assert.equal(requiresSecondFactor([], 'aal1'), false);
assert.equal(requiresSecondFactor(undefined, 'aal1'), false);
console.log('Redirecionamentos maliciosos bloqueados; MFA exige confirmação e não bloqueia fatores incompletos.');
