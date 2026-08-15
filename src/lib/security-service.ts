/**
 * Utilitário de Segurança Anti-XSS (Sanitização)
 * Impede que injeções de código malicioso cheguem ao banco de dados.
 */

// Tags e atributos perigosos comuns em ataques XSS
const DANGEROUS_TAGS_REGEX = /<\/?(script|style|iframe|object|embed|applet|meta|svg|base|form|input|button|select)[^>]*>/gi;
const DANGEROUS_ATTRS_REGEX = /on\w+\s*=\s*(['"]?)(.*?)\1/gi;
const JAVASCRIPT_URI_REGEX = /javascript\s*:/gi;

export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  
  let safeStr = input;
  
  // 1. Remove tags HTML perigosas
  safeStr = safeStr.replace(DANGEROUS_TAGS_REGEX, '');
  
  // 2. Remove atributos de evento (ex: onload=, onerror=)
  safeStr = safeStr.replace(DANGEROUS_ATTRS_REGEX, '');
  
  // 3. Remove URIs contendo javascript:
  safeStr = safeStr.replace(JAVASCRIPT_URI_REGEX, 'blocked:');

  // 4. Remove injeção de eval/expressões
  safeStr = safeStr.replace(/expression\s*\(/gi, 'blocked(');
  
  return safeStr.trim();
}

/**
 * Valida se a string contém tentativa de XSS severa
 */
export function hasXssAttempt(input: string): boolean {
  if (!input) return false;
  return (
    /<script/i.test(input) ||
    /javascript:/i.test(input) ||
    /onerror=/i.test(input) ||
    /onload=/i.test(input) ||
    /<iframe/i.test(input)
  );
}

/**
 * Filtro recursivo para sanitizar objetos inteiros (ex: payload do express)
 */
export function sanitizePayload(payload: any): any {
  if (typeof payload === 'string') {
    return sanitizeText(payload);
  }
  
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item));
  }
  
  if (payload !== null && typeof payload === 'object') {
    const safeObj: any = {};
    for (const key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        safeObj[key] = sanitizePayload(payload[key]);
      }
    }
    return safeObj;
  }
  
  return payload;
}
