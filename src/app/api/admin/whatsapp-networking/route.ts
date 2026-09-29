import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/api-auth';
import { isCreatorNetworkingPresetId, renderCreatorNetworkingMessage, type CreatorNetworkingPresetId } from '@/lib/creator-networking';
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
  groupInviteSent: boolean;
  groupInviteSentAt: string | null;
};

type GroupInviteMetadata = {
  status?: 'PROCESSING' | 'SENT' | 'FAILED';
  token?: string;
  attempts?: number;
  lastAttemptAt?: string;
  sentAt?: string;
  lastError?: string;
};

const GROUP_INVITE_METADATA_KEY = 'creator_networking_group_invite';

function readGroupInviteMetadata(appMetadata: Record<string, unknown> | null | undefined): GroupInviteMetadata {
  const value = appMetadata?.[GROUP_INVITE_METADATA_KEY];
  return value && typeof value === 'object' ? value as GroupInviteMetadata : {};
}

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

  const usersById = new Map<string, { name?: string; phone?: unknown; groupInvite: GroupInviteMetadata }>();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (usersError) throw new Error(usersError.message);
    for (const user of data.users) {
      const metadata = user.user_metadata || {};
      usersById.set(user.id, {
        name: String(metadata.full_name || metadata.name || user.email?.split('@')[0] || '').trim(),
        phone: metadata.whatsapp || metadata.phone || user.phone,
        groupInvite: readGroupInviteMetadata(user.app_metadata),
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
      groupInviteSent: user?.groupInvite.status === 'SENT',
      groupInviteSentAt: user?.groupInvite.status === 'SENT' ? user.groupInvite.sentAt || null : null,
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
        groupInviteSent: creators.filter((creator) => creator.groupInviteSent).length,
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

async function claimGroupInvite(recipient: CreatorRecipient) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(recipient.id);
  if (error || !data.user) throw error || new Error('Criador não encontrado.');
  const appMetadata = data.user.app_metadata || {};
  const existing = readGroupInviteMetadata(appMetadata);
  if (existing.status === 'SENT') return null;
  const processingIsRecent = existing.status === 'PROCESSING' && existing.lastAttemptAt
    && Date.now() - new Date(existing.lastAttemptAt).getTime() < 10 * 60 * 1000;
  if (processingIsRecent) return null;

  const token = crypto.randomUUID();
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(recipient.id, {
    app_metadata: {
      ...appMetadata,
      [GROUP_INVITE_METADATA_KEY]: {
        status: 'PROCESSING', token, attempts: Number(existing.attempts || 0) + 1,
        lastAttemptAt: now, lastError: null,
      },
    },
  });
  if (updateError) throw updateError;

  // Confirma que esta execução ainda possui a reserva antes de enviar.
  const verification = await supabaseAdmin.auth.admin.getUserById(recipient.id);
  if (verification.error) throw verification.error;
  return readGroupInviteMetadata(verification.data.user?.app_metadata).token === token ? token : null;
}

async function finishGroupInvite(creatorId: string, token: string, sent: boolean, error?: string) {
  const now = new Date().toISOString();
  const { data, error: readError } = await supabaseAdmin.auth.admin.getUserById(creatorId);
  if (readError || !data.user) throw readError || new Error('Criador não encontrado.');
  const appMetadata = data.user.app_metadata || {};
  const current = readGroupInviteMetadata(appMetadata);
  if (current.token !== token) return;
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(creatorId, {
    app_metadata: {
      ...appMetadata,
      [GROUP_INVITE_METADATA_KEY]: {
        ...current, token: null, status: sent ? 'SENT' : 'FAILED',
        sentAt: sent ? now : current.sentAt || null,
        lastError: sent ? null : (error || 'Falha não identificada.').slice(0, 500),
      },
    },
  });
  if (updateError) throw updateError;
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  try {
    const body = await request.json() as { text?: unknown; imageUrl?: unknown; creatorIds?: unknown; presetId?: unknown };
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2000) : '';
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim().slice(0, 2000) : '';
    const selectedIds = parseSelectedIds(body.creatorIds);
    const presetId: CreatorNetworkingPresetId = isCreatorNetworkingPresetId(body.presetId) ? body.presetId : 'welcome';
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
    const sentIds: string[] = [];
    let sent = 0;
    let alreadySent = 0;

    for (let offset = 0; offset < uniqueRecipients.length; offset += 5) {
      const batch = uniqueRecipients.slice(offset, offset + 5);
      const results = await Promise.all(batch.map(async (recipient) => {
        const message = renderCreatorNetworkingMessage(text, recipient);
        let historyToken: string | null = null;
        try {
          historyToken = presetId === 'group' ? await claimGroupInvite(recipient) : null;
          if (presetId === 'group' && !historyToken) return { recipient, result: null, alreadySent: true };
          const result = imageUrl
            ? await sendEvolutionImage(recipient.phone, imageUrl, message)
            : await sendEvolutionText(recipient.phone, message);
          if (historyToken) await finishGroupInvite(recipient.id, historyToken, result.sent, result.error);
          return { recipient, result, alreadySent: false };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Não foi possível registrar este envio.';
          if (historyToken) await finishGroupInvite(recipient.id, historyToken, false, message).catch(() => undefined);
          return { recipient, result: { sent: false, error: message }, alreadySent: false };
        }
      }));

      for (const { recipient, result, alreadySent: skippedHistory } of results) {
        if (skippedHistory || !result) {
          alreadySent += 1;
          continue;
        }
        if (result.sent) {
          sent += 1;
          sentIds.push(recipient.id);
        }
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
        alreadySent,
        failures: failures.slice(0, 50),
        sentIds,
      },
    }, { status: failures.length === uniqueRecipients.length && uniqueRecipients.length > 0 ? 503 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível concluir o envio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
