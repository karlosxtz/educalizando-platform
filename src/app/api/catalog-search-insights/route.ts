import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR').slice(0, 120);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === 'string' ? normalize(body.query) : '';
  if (query.length < 2) return NextResponse.json({ recorded: false });
  const { error } = await supabaseAdmin.from('catalog_search_events').insert({ query, normalized_query: query });
  if (error) console.warn('[catalog-search-insights] Não foi possível registrar busca:', error.message);
  return NextResponse.json({ recorded: !error });
}

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await supabaseAdmin.from('catalog_search_events').select('normalized_query').gte('created_at', since).limit(2000);
  if (error) return NextResponse.json({ terms: [] });
  const counts = new Map<string, number>();
  for (const item of data || []) counts.set(item.normalized_query, (counts.get(item.normalized_query) || 0) + 1);
  const terms = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')).slice(0, 6).map(([term, count]) => ({ term, count }));
  return NextResponse.json({ terms });
}
