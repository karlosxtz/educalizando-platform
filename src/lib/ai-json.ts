/** Repair syntax only. Never complete missing strings, fields or truncated objects. */
function parseCompleteObject(text: string): Record<string, unknown> | null {
  let normalized = '', quoted = false, escaped = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (escaped) { normalized += char; escaped = false; continue; }
      if (char === '\\') { normalized += char; escaped = true; continue; }
      if (char === '"') quoted = false;
      if (char.charCodeAt(0) < 32) { normalized += JSON.stringify(char).slice(1, -1); continue; }
    } else {
      if (char === '"') quoted = true;
      if (char === ',' && /^\s*[}\]]/.test(text.slice(index + 1))) continue;
    }
    normalized += char;
  }
  try {
    const value: unknown = JSON.parse(normalized);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}
/** Parse complete objects without repairing truncated or invented facts. */
export function extractAiJson(text: string): Record<string, unknown> | null {
  const candidate = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  if (candidate.startsWith('[')) return null;
  const direct = parseCompleteObject(candidate);
  if (direct) return direct;
  let start = -1, depth = 0, quoted = false, escaped = false;
  for (let index = 0; index < candidate.length; index++) {
    const char = candidate[index];
    if (start < 0) { if (char === '{') { start = index; depth = 1; } continue; }
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) {
      return parseCompleteObject(candidate.slice(start, index + 1));
    }
  }
  return null;
}
export const AI_FORMAT_ERROR = 'A IA não entregou uma resposta completa no formato necessário. Nenhuma alteração foi aplicada. Tente gerar novamente.';
