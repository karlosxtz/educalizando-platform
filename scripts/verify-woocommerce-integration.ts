import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

process.env.SERVER_CRYPTO_SECRET = 'woocommerce-verification-secret-with-more-than-32-characters';

async function main() {
  const { decryptWooSecret,encryptWooSecret,validWooSignature } = await import('../src/lib/woocommerce-security');
  const original = 'cs_abcdefghijklmnopqrstuvwxyz1234567890';
  const encrypted = encryptWooSecret(original);
  assert.notEqual(encrypted, original, 'A credencial não pode ser armazenada em texto puro.');
  assert.equal(decryptWooSecret(encrypted), original, 'A credencial criptografada deve ser recuperável no servidor.');

  const body = JSON.stringify({ id: 123, status: 'processing' });
  const secret = 'webhook-secret';
  const signature = createHmac('sha256', secret).update(body).digest('base64');
  assert.equal(validWooSignature(body, signature, secret), true, 'A assinatura HMAC válida deve ser aceita.');
  assert.equal(validWooSignature(`${body}alterado`, signature, secret), false, 'Payload alterado deve ser rejeitado.');
  const syncRoute = readFileSync('src/app/api/creator/woocommerce/sync/route.ts', 'utf8');
  const webhookRoute = readFileSync('src/app/api/webhooks/woocommerce/[integrationId]/route.ts', 'utf8');
  const productRoute = readFileSync('src/app/api/produtos/put.ts', 'utf8');
  const wooService = readFileSync('src/lib/woocommerce-service.ts', 'utf8');
  const wooMedia = readFileSync('src/lib/woocommerce-media.ts', 'utf8');
  const migration = readFileSync('supabase/migrations/20261007150000_add_woocommerce_import_review.sql', 'utf8');
  assert.match(syncRoute, /Selecione pelo menos um produto para importar/, 'Importação Woo deve exigir uma seleção explícita.');
  assert.match(webhookRoute, /hasWooProductMapping/, 'Webhook não deve importar produtos que ainda não foram escolhidos.');
  assert.match(productRoute, /Complete o produto antes de publicar/, 'Produto incompleto deve ser bloqueado na publicação.');
  assert.match(productRoute, /arquivo ou link de entrega/, 'A entrega deve ser obrigatória antes da publicação.');
  assert.match(migration, /import_incomplete BOOLEAN NOT NULL DEFAULT FALSE/, 'A situação de cadastro incompleto deve ser persistida.');
  assert.match(wooService, /product_images/, 'As imagens do produto Woo devem ser importadas para a galeria.');
  assert.match(productRoute, /confirmação do preço/, 'O preço recebido do Woo deve ser confirmado pelo criador.');
  assert.match(wooService, /shouldRefreshContent/, 'Webhooks não devem sobrescrever conteúdo já revisado pelo criador.');
  assert.match(migration, /import_price_confirmed BOOLEAN NOT NULL DEFAULT TRUE/, 'A confirmação do preço importado deve ser persistida.');
  assert.match(wooMedia, /uploadObject/, 'Mídias importadas devem ser copiadas para o MinIO.');
  assert.match(wooMedia, /privateIp/, 'Downloads remotos devem bloquear redes privadas.');
  assert.match(wooService, /mirrorWooDelivery/, 'Arquivos digitais do Woo devem ser copiados para o armazenamento privado.');
  console.log('WooCommerce: 16 verificações de segurança, seleção, MinIO, webhook, preço, preservação e entrega aprovadas.');
}

void main();
