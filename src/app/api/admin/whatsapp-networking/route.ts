import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/api-auth';
import { renderCreatorNetworkingMessage } from '@/lib/creator-networking';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeWhatsAppNumber, sendEvolutionImage, sendEvolutionText } from '@/lib/whatsapp-notification-service';

export const runtime = 'nodejs';
export const maxDuration = 300;

type CreatorRecipient = {
  id: string;
  name: string;
  storeName: string;
  storeSlug: string;
  phone: string | null;
  phoneLabel: string;
  logoUrl: string | null;
};

function readablePhone(phone: string | null) {
  if (!phone) return 'WhatsApp não cadastrado';
  const local = phone.startsWith('55') ? phone.slice(2) : phone;
  if (local.length < 10) return 'WhatsApp inválido';
  const ddd = local.slice(0, 2);
  return `(${ddd}) *****-${local.slice(-4)}`;
}

async function getCreatorRecipients(): Promise<CreatorRecipient[]> {
  const { data: stores, error } = await supabaseAdmin
    .from('stores')
    .select('id, creator_id, nome_loja, slug, whatsapp, logo_url, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const latestStoreByCreator = new Map<string, NonNullable<typeof stores>[number]>();
  for (const store of stores || []) {
    if (store.creator_id && !latestStoreByCreator.has(store.creator_id)) latestStoreByCreator.set(store.creator_id, store);
  }

  const usersById = new Map<string, { name?: string; phone?: unknown }>();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (usersError) throw new Error(usersError.message);
    for (const user of data.users) {
      const metadata = user.user_metadata || {};
      usersById.set(user.id, {
        name: String(metadata.full_name || metadata.name || user.email?.split('@')[0] || '').trim(),
        phone: metadata.whatsapp || metadata.phone || user.phone,
      });
    }
    if (data.users.length < 1000) break;
  }

  return Array.from(latestStoreByCreator.values()).map((store) => {
    const user = usersById.get(store.creator_id);
    const phone = normalizeWhatsAppNumber(store.whatsapp || user?.phone);
    return {
      id: store.creator_id,
      name: user?.name || store.nome_loja || 'Criador(a)',
      storeName: store.nome_loja || 'Loja Educalizando',
      storeSlug: store.slug || '',
      phone,
      phoneLabel: readablePhone(phone),
      logoUrl: store.logo_url || null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  try {
    const creators = await getCreatorRecipients();
    return NextResponse.json({
      success: true,
      creators: creators.map(({ phone, ...creator }) => ({ ...creator, hasWhatsapp: Boolean(phone) })),
      summary: {
        total: creators.length,
        available: creators.filter((creator) => creator.phone).length,
        unavailable: creators.filter((creator) => !creator.phone).length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível carregar os criadores.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseSelectedIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length <= 100))].slice(0, 2000);
}

async function pause(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  try {
    const body = await request.json() as { text?: unknown; imageUrl?: unknown; creatorIds?: unknown };
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2000) : '';
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim().slice(0, 2000) : '';
    const selectedIds = parseSelectedIds(body.creatorIds);
    if (!text) return NextResponse.json({ error: 'Escreva a mensagem que será enviada.' }, { status: 400 });
    if (!selectedIds.length) return NextResponse.json({ error: 'Selecione pelo menos um criador.' }, { status: 400 });
    if (imageUrl && !/^https:\/\//i.test(imageUrl)) return NextResponse.json({ error: 'A imagem anexada é inválida.' }, { status: 400 });

    const selected = new Set(selectedIds);
    const allRecipients = await getCreatorRecipients();
    const recipients = allRecipients.filter((recipient) => selected.has(recipient.id) && recipient.phone);
    const skipped = selectedIds.length - recipients.length;
    const uniqueRecipients = Array.from(new Map(recipients.map((recipient) => [recipient.phone, recipient])).values());
    if (!uniqueRecipients.length) {
      return NextResponse.json({ error: 'Nenhum dos criadores selecionados possui um WhatsApp válido.' }, { status: 400 });
    }
    const failures: Array<{ id: string; name: string; error: string }> = [];
    let sent = 0;

    for (let offset = 0; offset < uniqueRecipients.length; offset += 5) {
      const batch = uniqueRecipients.slice(offset, offset + 5);
      const results = await Promise.all(batch.map(async (recipient) => {
        const message = renderCreatorNetworkingMessage(text, recipient);
        const result = imageUrl
          ? await sendEvolutionImage(recipient.phone, imageUrl, message)
          : await sendEvolutionText(recipient.phone, message);
        return { recipient, result };
      }));

      for (const { recipient, result } of results) {
        if (result.sent) sent += 1;
        else failures.push({ id: recipient.id, name: recipient.name, error: result.error || 'Falha não identificada.' });
      }
      if (offset + 5 < uniqueRecipients.length) await pause(500);
    }

    return NextResponse.json({
      success: failures.length === 0,
      result: {
        requested: selectedIds.length,
        eligible: uniqueRecipients.length,
        sent,
        failed: failures.length,
        skipped,
        duplicates: recipients.length - uniqueRecipients.length,
        failures: failures.slice(0, 50),
      },
    }, { status: failures.length === uniqueRecipients.length && uniqueRecipients.length > 0 ? 503 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível concluir o envio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
