import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

const BANNER_TYPES = new Set(['info', 'warning', 'error', 'success']);

function normalizeBannerLink(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const link = value.trim();
  if (link.startsWith('/') && !link.startsWith('//')) return link;
  try {
    const url = new URL(link);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeBanner(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 120) : null;
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 600) : '';
  const type = typeof body.type === 'string' ? body.type : '';
  const linkUrl = normalizeBannerLink(body.link_url);
  const requestedLink = typeof body.link_url === 'string' && body.link_url.trim();
  const linkText = typeof body.link_text === 'string' && body.link_text.trim() ? body.link_text.trim().slice(0, 80) : null;
  return { title, message, type, linkUrl, requestedLink, linkText };
}

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: banners, error } = await supabaseAdmin
      .from('system_banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, banners });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, type, linkUrl, requestedLink, linkText } = normalizeBanner(body);

    if (!message || !BANNER_TYPES.has(type) || (requestedLink && !linkUrl)) {
      return NextResponse.json({ error: 'Mensagem e tipo são obrigatórios' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('system_banners')
      .insert([{ title, message, type, is_active: Boolean(body.is_active), link_url: linkUrl, link_text: linkText }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const { title, message, type, linkUrl, requestedLink, linkText } = normalizeBanner(body);

    if (!id || !message || !BANNER_TYPES.has(type) || (requestedLink && !linkUrl)) {
      return NextResponse.json({ error: 'ID, mensagem e tipo são obrigatórios' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('system_banners')
      .update({ title, message, type, is_active: Boolean(body.is_active), link_url: linkUrl, link_text: linkText })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('system_banners')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
