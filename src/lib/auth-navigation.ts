export function safeAuthDestination(value: string | null, fallback = '/entrar') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return fallback;
  return value;
}
