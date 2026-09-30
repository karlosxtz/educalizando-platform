export function normalizeProductTags(values: string[], limit = 10) {
  const normalized: string[] = [];
  for (const value of values) {
    for (const part of value.split(/[,;\n\t\s]+/)) {
      const tag = part.trim().toLocaleLowerCase('pt-BR').slice(0, 40);
      if (tag && !normalized.includes(tag)) normalized.push(tag);
      if (normalized.length >= limit) return normalized;
    }
  }
  return normalized;
}
