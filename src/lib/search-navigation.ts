export function searchHref(current: string, changes: Record<string, string | null>) {
  const params = new URLSearchParams(current);
  params.delete('page');
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params.size ? `/buscar?${params.toString()}` : '/buscar';
}

export function searchPage(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
