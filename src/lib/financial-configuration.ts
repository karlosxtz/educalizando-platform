import crypto from 'crypto';

export type FinancialConfigurationState = 'configured' | 'not_configured' | 'invalid';
export type FinancialEnvironment = 'production' | 'development' | 'test';

type ConfigurationStatus = { state: FinancialConfigurationState };

export type FinancialConfiguration = {
  environment: FinancialEnvironment;
  infinitePay: ConfigurationStatus;
  cryptography: ConfigurationStatus;
  checkout: ConfigurationStatus;
};

export class FinancialConfigurationError extends Error {
  constructor() {
    super('A configuração financeira do servidor está indisponível.');
    this.name = 'FinancialConfigurationError';
  }
}

// Digest only: the historical value itself is never kept in source code.
const LEGACY_HANDLE_DIGEST = '66dc3a33051501c2683141e780e3e0510baadc56b2f103669bbd59f8852a3464';
const UNSAFE_VALUE_PATTERN = /(placeholder|dummy|example|change[-_ ]?me|your[-_ ]?|legacy|default|test|mock|undefined|null)/i;

function normalize(value: string | undefined): string {
  return (value || '').trim().replace(/^\$/, '');
}

function environmentFrom(source: NodeJS.ProcessEnv): FinancialEnvironment {
  if (source.NODE_ENV === 'production') return 'production';
  if (source.NODE_ENV === 'test') return 'test';
  return 'development';
}

function stateForHandle(value: string, environment: FinancialEnvironment): FinancialConfigurationState {
  if (!value) return 'not_configured';

  const isControlledTestValue = environment === 'test' && value === 'test-infinitepay-handle';
  if (
    !isControlledTestValue &&
    (UNSAFE_VALUE_PATTERN.test(value) || crypto.createHash('sha256').update(value).digest('hex') === LEGACY_HANDLE_DIGEST)
  ) {
    return 'invalid';
  }

  return /^[a-z0-9][a-z0-9-]{2,80}$/i.test(value) ? 'configured' : 'invalid';
}

function stateForCryptoSecret(value: string, environment: FinancialEnvironment): FinancialConfigurationState {
  if (!value) return 'not_configured';

  const isControlledTestValue = environment === 'test' && value === 'test-server-crypto-secret-for-unit-tests-only-123456';
  if (!isControlledTestValue && (UNSAFE_VALUE_PATTERN.test(value) || value.length < 32)) return 'invalid';

  return 'configured';
}

export function getFinancialConfiguration(source: NodeJS.ProcessEnv = process.env): FinancialConfiguration {
  const environment = environmentFrom(source);
  const infinitePayState = stateForHandle(normalize(source.INFINITEPAY_HANDLE), environment);
  const cryptographyState = stateForCryptoSecret(normalize(source.SERVER_CRYPTO_SECRET), environment);

  return {
    environment,
    infinitePay: { state: infinitePayState },
    cryptography: { state: cryptographyState },
    checkout: {
      state: infinitePayState === 'configured' && cryptographyState === 'configured'
        ? 'configured'
        : infinitePayState === 'not_configured' || cryptographyState === 'not_configured'
          ? 'not_configured'
          : 'invalid',
    },
  };
}

export function assertCheckoutFinancialConfiguration(source: NodeJS.ProcessEnv = process.env): void {
  if (getFinancialConfiguration(source).checkout.state !== 'configured') {
    throw new FinancialConfigurationError();
  }
}

export function getConfiguredInfinitePayHandle(source: NodeJS.ProcessEnv = process.env): string {
  const handle = normalize(source.INFINITEPAY_HANDLE);
  if (stateForHandle(handle, environmentFrom(source)) !== 'configured') {
    throw new FinancialConfigurationError();
  }
  return handle;
}

export function getConfiguredCryptoSecret(source: NodeJS.ProcessEnv = process.env): string {
  const secret = normalize(source.SERVER_CRYPTO_SECRET);
  if (stateForCryptoSecret(secret, environmentFrom(source)) !== 'configured') {
    throw new FinancialConfigurationError();
  }
  return secret;
}
