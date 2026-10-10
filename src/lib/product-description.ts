/** Converts copied/imported HTML into readable text for the plain-text editor. */
export function readableProductDescription(value: string): string {
  if (!/<\/?[a-z][^>]*>/i.test(value) && !/&(?:[a-z]+|#\d+|#x[0-9a-f]+);/i.test(value)) return value;
  const text = value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<\/(?:p|div|li|h[1-6]|tr|ul|ol)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] !== '#') return entities[entity.toLowerCase()] ?? match;
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  }).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
