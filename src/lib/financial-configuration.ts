import crypto from 'node:crypto';

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

const UNSAFE_VALUE_PATTERN = /(placeholder|dummy|example|change[-_ ]?me|your[-_ ]?|legacy|default|test|mock|undefined|null)/i;
// A InfiniteTag é um identificador público da conta central (também aparece no
// checkout hospedado), portanto pode existir como fallback controlado. Um valor
// explícito no ambiente sempre tem prioridade e continua sendo validado.
const PLATFORM_INFINITEPAY_HANDLE = 'carlos-eduardo-a4j';
const CRYPTO_DERIVATION_CONTEXT = 'educalizando:financial-signatures:v1';

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
    UNSAFE_VALUE_PATTERN.test(value)
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

function configuredHandle(source: NodeJS.ProcessEnv) {
  const explicit = normalize(source.INFINITEPAY_HANDLE);
  return explicit || PLATFORM_INFINITEPAY_HANDLE;
}

function configuredCryptoSecret(source: NodeJS.ProcessEnv) {
  const explicit = normalize(source.SERVER_CRYPTO_SECRET);
  if (explicit) return explicit;

  // Produções antigas já possuem esta credencial servidor forte. Derivamos uma
  // chave exclusiva por contexto, sem reutilizar nem expor o valor original.
  const serviceRoleKey = normalize(source.SUPABASE_SERVICE_ROLE_KEY);
  if (serviceRoleKey.length < 32 || !/^(eyJ|sb_secret_)/.test(serviceRoleKey)) return '';
  return crypto.createHmac('sha256', serviceRoleKey).update(CRYPTO_DERIVATION_CONTEXT).digest('hex');
}

export function getFinancialConfiguration(source: NodeJS.ProcessEnv = process.env): FinancialConfiguration {
  const environment = environmentFrom(source);
  const infinitePayState = stateForHandle(configuredHandle(source), environment);
  const cryptographyState = stateForCryptoSecret(configuredCryptoSecret(source), environment);

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
  const handle = configuredHandle(source);
  if (stateForHandle(handle, environmentFrom(source)) !== 'configured') {
    throw new FinancialConfigurationError();
  }
  return handle;
}

export function getConfiguredCryptoSecret(source: NodeJS.ProcessEnv = process.env): string {
  const secret = configuredCryptoSecret(source);
  if (stateForCryptoSecret(secret, environmentFrom(source)) !== 'configured') {
    throw new FinancialConfigurationError();
  }
  return secret;
}
