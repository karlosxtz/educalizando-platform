export type PlatformDelivery = { name: string; url: string };

/** Only the authenticated export's confirmed files[{name,url}] contract is used. */
export function platformDeliveries(value: unknown): PlatformDelivery[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 100) throw new Error('A exportação retornou uma lista de arquivos inválida ou maior que 100 por produto.');
  const files: PlatformDelivery[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object' || typeof item.url !== 'string') throw new Error('A exportação retornou um arquivo sem endereço válido.');
    let url: URL;
    try { url = new URL(item.url); } catch { throw new Error('A exportação retornou um arquivo sem endereço válido.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || item.url.length > 8192) throw new Error('A exportação retornou um arquivo sem endereço HTTPS válido.');
    if (seen.has(url.toString())) continue;
    seen.add(url.toString());
    files.push({ url: url.toString(), name: typeof item.name === 'string' && item.name.trim() ? item.name.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 160) : `Material ${files.length + 1}` });
  }
  return files;
}
