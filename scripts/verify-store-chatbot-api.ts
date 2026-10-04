import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildStoreChatbotN8nWorkflow } from '../src/lib/store-chatbot-n8n-workflow';

const root = process.cwd();
const integration = readFileSync(join(root, 'src', 'app', 'api', 'integrations', 'store-chatbot', 'route.ts'), 'utf8');
const management = readFileSync(join(root, 'src', 'app', 'api', 'creator', 'whatsapp-module', 'chatbot-api-key', 'route.ts'), 'utf8');
const helper = readFileSync(join(root, 'src', 'lib', 'store-chatbot-api.ts'), 'utf8');
const migration = readFileSync(join(root, 'supabase', 'migrations', '20261003220000_create_store_chatbot_api_keys.sql'), 'utf8');

assert.match(helper, /randomBytes\(32\)/, 'A chave deve ter entropia criptográfica suficiente.');
assert.match(helper, /createHash\('sha256'\)/, 'A chave precisa ser armazenada por hash.');
assert.match(integration, /readStoreChatbotApiKey\(request\)/, 'O endpoint precisa exigir uma chave.');
assert.match(integration, /resolveCreatorWhatsAppAccess\(keyRecord\.store_id\)/, 'Cada chamada precisa revalidar o acesso comercial.');
assert.match(integration, /\.eq\('store_id', keyRecord\.store_id\)/, 'As consultas precisam ser isoladas pelo store_id da chave.');
assert.match(integration, /externalSearch: false/, 'A resposta precisa declarar que não pesquisa fontes externas.');
assert.doesNotMatch(integration, /orders|purchases|product_deliveries|arquivo_url/, 'A API pública não pode consultar pedidos, compras nem arquivos de entrega.');
assert.match(management, /key_hash: generated\.hash/, 'A rota de geração não deve persistir a chave completa.');
assert.doesNotMatch(management, /apiKey:\s*record/, 'A leitura da configuração nunca pode devolver a chave persistida.');
assert.match(migration, /revoke all on table public\.store_chatbot_api_keys from anon, authenticated/i, 'A tabela de chaves deve ser inacessível aos clientes do Supabase.');

const workflow = buildStoreChatbotN8nWorkflow({ endpoint: 'https://example.com/api/integrations/store-chatbot', apiKey: 'edu_live_test_secret' });
const workflowText = JSON.stringify(workflow);
assert.match(workflowText, /n8n-nodes-base\.httpRequest/, 'O arquivo importável precisa trazer o nó HTTP Request.');
assert.match(workflowText, /Authorization/, 'O fluxo precisa configurar a autenticação automaticamente.');
assert.match(workflowText, /Bearer edu_live_test_secret/, 'A chave deve ser incluída no cabeçalho do nó.');
assert.doesNotMatch(workflowText, /api[_-]?key=/i, 'A chave não pode ser colocada na URL da consulta.');

console.log('API privada por loja validada: chave com hash, acesso comercial, isolamento e catálogo público.');
