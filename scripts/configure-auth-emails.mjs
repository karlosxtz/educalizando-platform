import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const messages = [
  ['confirmation', 'Confirme seu cadastro', 'Seu próximo passo começa aqui', 'Confirme seu e-mail para acessar sua conta na Educalizando.', 'Confirmar meu e-mail', true],
  ['invite', 'Você recebeu um convite', 'Você faz parte das novas possibilidades', 'Você foi convidado para a Educalizando. Aceite o convite para acessar sua conta e configurar sua senha.', 'Aceitar convite'],
  ['magic_link', 'Seu acesso à Educalizando', 'Entre e continue de onde parou', 'Use o botão abaixo ou o código para entrar na sua conta. Este acesso é pessoal e só pode ser utilizado uma vez.', 'Entrar na minha conta', true],
  ['email_change', 'Confirme a troca de e-mail', 'Vamos atualizar seu acesso', 'Recebemos uma solicitação para alterar o e-mail da sua conta para <strong>{{ .NewEmail }}</strong>. Confirme somente se você pediu esta alteração.', 'Confirmar alteração'],
  ['recovery', 'Redefina sua senha', 'Vamos recuperar seu acesso?', 'Recebemos uma solicitação para redefinir a senha da sua conta. Escolha uma nova senha para voltar a acessar seus materiais.', 'Criar minha nova senha'],
  ['reauthentication', 'Confirme sua identidade', 'Uma confirmação para proteger sua conta', 'Digite o código abaixo na Educalizando para confirmar a alteração solicitada. Não compartilhe este código.', null, true],
  ['password_changed_notification', 'Sua senha foi alterada', 'Senha atualizada', 'A senha da sua conta foi alterada. Se você não reconhece esta ação, solicite a recuperação da senha e entre em contato com a Educalizando.'],
  ['email_changed_notification', 'O e-mail da sua conta foi alterado', 'E-mail atualizado', 'O e-mail da sua conta foi alterado de <strong>{{ .OldEmail }}</strong> para <strong>{{ .Email }}</strong>.'],
  ['phone_changed_notification', 'Seu telefone foi alterado', 'Telefone atualizado', 'O telefone de autenticação foi alterado de <strong>{{ .OldPhone }}</strong> para <strong>{{ .Phone }}</strong>.'],
  ['identity_linked_notification', 'Novo método de login conectado', 'Mais uma forma de acessar', 'O método de login <strong>{{ .Provider }}</strong> foi conectado à sua conta.'],
  ['identity_unlinked_notification', 'Método de login removido', 'Seu acesso foi atualizado', 'O método de login <strong>{{ .Provider }}</strong> foi removido da sua conta.'],
  ['mfa_factor_enrolled_notification', 'Proteção em duas etapas ativada', 'Sua conta ganhou mais proteção', 'Um método de verificação <strong>{{ .FactorType }}</strong> foi adicionado à sua conta.'],
  ['mfa_factor_unenrolled_notification', 'Proteção em duas etapas removida', 'Confira a segurança da sua conta', 'Um método de verificação <strong>{{ .FactorType }}</strong> foi removido da sua conta.'],
];
export function emailHtml([key, subject, title, text, button, token]) {
  const notification = key.endsWith('_notification');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject} | Educalizando</title></head><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#334155"><div style="display:none;max-height:0;overflow:hidden">${subject} — Educalizando</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden"><tr><td align="center" style="background:#155eef;padding:30px 20px;color:#fff"><a href="https://www.educalizando.com.br" style="color:#fff;text-decoration:none;font-size:28px;font-weight:bold">Educalizando</a><p style="font-size:14px;line-height:1.6">Conectando educadores a novas possibilidades</p></td></tr><tr><td style="padding:32px 24px"><h1 style="font-size:25px;color:#0f172a;line-height:1.3">${title}</h1><p style="font-size:16px;line-height:1.7">Olá!</p><p style="font-size:16px;line-height:1.7">${text}</p>${button ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto"><tr><td bgcolor="#155eef" style="border-radius:12px"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:17px 24px;color:#fff;text-decoration:none;font-weight:bold">${button}</a></td></tr></table><p style="font-size:13px;line-height:1.7">Se o botão não funcionar, copie este endereço no navegador:<br><a href="{{ .ConfirmationURL }}" style="color:#155eef;word-break:break-all">{{ .ConfirmationURL }}</a></p>` : ''}${token ? '<p style="font-size:14px">Seu código de confirmação:</p><p style="padding:18px;background:#eff6ff;border-radius:12px;text-align:center;font-size:30px;font-weight:bold;letter-spacing:6px;color:#155eef">{{ .Token }}</p>' : ''}<div style="padding:18px;background:#eff6ff;border-radius:12px;font-size:14px;line-height:1.7"><strong>${notification ? 'Não reconhece esta alteração?' : 'Não solicitou este e-mail?'}</strong><br>${notification ? 'Acesse a Educalizando pelo endereço oficial, confira a segurança da sua conta e solicite ajuda pelo atendimento do site.' : 'Ignore esta mensagem. Não compartilhe links ou códigos de acesso com outras pessoas.'}</div>${notification ? '<p><a href="https://www.educalizando.com.br/seguranca" style="color:#155eef">Conferir segurança da minha conta</a></p>' : ''}<p style="line-height:1.7;margin-top:28px">Até breve,<br><strong style="color:#155eef">Equipe Educalizando</strong></p></td></tr><tr><td align="center" style="padding:22px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.7;color:#64748b">Mensagem automática sobre sua conta.<br><a href="https://www.educalizando.com.br" style="color:#155eef;text-decoration:none">www.educalizando.com.br</a></td></tr></table></td></tr></table></body></html>`;
}
export function authEmailConfig() {
  const config = { site_url: 'https://www.educalizando.com.br', mailer_autoconfirm: false, mailer_secure_email_change_enabled: true, security_update_password_require_reauthentication: true, security_manual_linking_enabled: true, mfa_totp_enroll_enabled: true, mfa_totp_verify_enabled: true };
  for (const item of messages) {
    config[`mailer_subjects_${item[0]}`] = `${item[1]} | Educalizando`;
    config[`mailer_templates_${item[0]}_content`] = emailHtml(item);
    if (item[0].endsWith('_notification')) config[`mailer_notifications_${item[0].replace(/_notification$/, '')}_enabled`] = true;
  }
  return config;
}
async function main() {
  const directory = resolve('supabase/email-templates');
  await mkdir(directory, { recursive: true });
  const config = authEmailConfig();
  for (const item of messages) await writeFile(resolve(directory, `${item[0]}.html`), emailHtml(item));
  await writeFile(resolve(directory, 'auth-config.json'), JSON.stringify(config, null, 2));
  console.log('13 modelos e configuração de autenticação gerados.');
  if (!process.argv.includes('--apply')) return;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const reference = process.env.SUPABASE_PROJECT_REF || 'ljmfonterxaiqvbdfkye';
  if (!token || !/^[a-z0-9]+$/.test(reference)) throw new Error('Configure SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF no ambiente. Nenhuma configuração remota foi alterada.');
  const endpoint = `https://api.supabase.com/v1/projects/${reference}/config/auth`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const currentResponse = await fetch(endpoint, { headers });
  if (!currentResponse.ok) throw new Error(`Não foi possível ler a configuração (${currentResponse.status}).`);
  const current = await currentResponse.json();
  // Preserva SMTP, provedores e destinos existentes. Não grava segredos em arquivo.
  const destinations = String(current.uri_allow_list || '').split(',').filter(Boolean);
  for (const path of ['/auth/confirmar', '/auth/confirmar?**', '/redefinir-senha']) destinations.push(`https://www.educalizando.com.br${path}`);
  const response = await fetch(endpoint, { method: 'PATCH', headers, body: JSON.stringify({ ...config, uri_allow_list: [...new Set(destinations)].join(',') }) });
  if (!response.ok) throw new Error(`Supabase não aceitou a configuração (${response.status}).`);
  const checked = await fetch(endpoint, { headers });
  if (!checked.ok) throw new Error('Configuração enviada, mas a verificação não terminou. Confira o painel.');
  const saved = await checked.json();
  if (Object.entries(config).some(([key, value]) => saved[key] !== value)) throw new Error('Alguma configuração não foi confirmada. Confira o painel.');
  console.log('Modelos e configurações confirmados no Supabase. SMTP e provedores preservados.');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
