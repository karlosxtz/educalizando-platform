import assert from 'node:assert/strict';
import {
  assertCheckoutFinancialConfiguration,
  FinancialConfigurationError,
  getFinancialConfiguration,
} from '../src/lib/financial-configuration';

const validProduction = {
  NODE_ENV: 'production',
  INFINITEPAY_HANDLE: 'educalizando-live-account',
  SERVER_CRYPTO_SECRET: 'secure-production-signing-secret-0123456789',
} as NodeJS.ProcessEnv;

function expectCheckoutBlocked(environment: NodeJS.ProcessEnv) {
  assert.throws(
    () => assertCheckoutFinancialConfiguration(environment),
    FinancialConfigurationError,
    'A validação deve impedir o checkout antes de qualquer pedido ou chamada externa.',
  );
}

assert.equal(getFinancialConfiguration(validProduction).checkout.state, 'configured');
assert.doesNotThrow(() => assertCheckoutFinancialConfiguration(validProduction));

expectCheckoutBlocked({ NODE_ENV: 'production' } as NodeJS.ProcessEnv);
expectCheckoutBlocked({ ...validProduction, INFINITEPAY_HANDLE: '' } as NodeJS.ProcessEnv);
expectCheckoutBlocked({ ...validProduction, SERVER_CRYPTO_SECRET: '' } as NodeJS.ProcessEnv);
expectCheckoutBlocked({ ...validProduction, INFINITEPAY_HANDLE: 'placeholder-handle' } as NodeJS.ProcessEnv);
expectCheckoutBlocked({ ...validProduction, SERVER_CRYPTO_SECRET: 'default-financial-secret-with-enough-characters' } as NodeJS.ProcessEnv);

const controlledTestConfiguration = {
  NODE_ENV: 'test',
  INFINITEPAY_HANDLE: 'test-infinitepay-handle',
  SERVER_CRYPTO_SECRET: 'test-server-crypto-secret-for-unit-tests-only-123456',
} as NodeJS.ProcessEnv;
assert.equal(getFinancialConfiguration(controlledTestConfiguration).checkout.state, 'configured');
assert.equal(getFinancialConfiguration({ ...controlledTestConfiguration, NODE_ENV: 'production' }).checkout.state, 'invalid');

console.log('Financial configuration validation passed.');
