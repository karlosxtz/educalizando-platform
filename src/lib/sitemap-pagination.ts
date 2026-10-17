export async function collectSitemapRows<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    const result = await read(from, from + 999);
    if (result.error) throw result.error;
    rows.push(...result.data || []);
    if (!result.data || result.data.length < 1000) return rows;
  }
  // A sitemap file supports at most 50,000 entries; never silently drop records.
  throw new Error('O catálogo precisa ser dividido em múltiplos sitemaps.');
}
