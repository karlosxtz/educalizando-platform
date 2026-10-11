import assert from 'node:assert/strict';
import { messages, authEmailConfig } from './configure-auth-emails.mjs';
const config = authEmailConfig();
assert.equal(messages.length, 13);
assert.equal(new Set(messages.map(item => item[0])).size, 13);
assert.equal(Object.keys(config).filter(key => key.startsWith('mailer_notifications_')).length, 7);
for (const [key, , , , button, token] of messages) {
  const html = config[`mailer_templates_${key}_content`];
  assert.ok(html.includes('lang="pt-BR"'));
  assert.ok(config[`mailer_subjects_${key}`].endsWith('| Educalizando'));
  if (button) assert.ok(html.includes('href="{{ .ConfirmationURL }}"'), `Link seguro ausente: ${key}`);
  if (token) assert.ok(html.includes('{{ .Token }}'), `Código ausente: ${key}`);
  if (key.endsWith('_notification')) {
    assert.equal(config[`mailer_notifications_${key.replace(/_notification$/, '')}_enabled`], true);
    assert.ok(!html.includes('{{ .ConfirmationURL }}'), `Notificação não tem link de confirmação: ${key}`);
  }
}
assert.equal(config.mailer_autoconfirm, false);
assert.equal(config.mailer_secure_email_change_enabled, true);
assert.equal(config.security_update_password_require_reauthentication, true);
assert.ok(!Object.keys(config).some(key => /smtp_pass|service_role|google_secret/.test(key)));
console.log('13 modelos validados; 7 avisos ativados no pacote; links/códigos preservados; nenhuma credencial incluída.');
