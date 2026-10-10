import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { creatorClubFinancials, creatorClubMaterialEligible, CREATOR_CLUB_DURATION_DAYS } from '../src/lib/creator-club';

assert.equal(creatorClubMaterialEligible('plr', { is_plr: false, has_plr_delivery: true }, true), false, 'Arquivo PLR sozinho não concede licença.');
assert.equal(creatorClubMaterialEligible('plr', { is_plr: true }), true, 'Um material licenciado pode ser selecionado para rascunho.');
assert.equal(creatorClubMaterialEligible('plr', { is_plr: true }, true), false, 'Clube publicado exige entrega PLR.');
assert.equal(creatorClubMaterialEligible('plr', { is_plr: true, has_plr_delivery: true }, true), true);
assert.equal(creatorClubMaterialEligible('final', { is_plr: false }, true), true, 'Clubes finais continuam aceitando os materiais existentes.');
assert.equal(creatorClubMaterialEligible('outro', { is_plr: true, has_plr_delivery: true }), false);

const financials = creatorClubFinancials(100, 'credit_card', 12);
assert.equal(financials.grossAmount, 100, 'O valor do clube deve ser preservado como base da venda.');
assert.equal(financials.platformFeeAmount, 13, 'A plataforma deve calcular 13% sobre a mensalidade definida pelo criador.');
assert.equal(financials.creatorNetAmount, 87, 'Os juros do cartão não podem reduzir o repasse do criador.');
assert.equal(CREATOR_CLUB_DURATION_DAYS, 30, 'A assinatura deve liberar exatamente 30 dias por pagamento.');

const checkout = readFileSync('src/app/api/creator-clubs/[clubId]/checkout/route.ts', 'utf8');
assert.match(checkout, /Number\(club\.monthly_price\)/, 'O checkout precisa ler o preço do clube no servidor.');
assert.doesNotMatch(checkout, /product\.preco|preco_kit/, 'O checkout do clube não pode derivar preço de produtos ou kits.');

const webhook = readFileSync('src/app/api/webhooks/infinitepay/route.ts', 'utf8');
assert.match(webhook, /assertConfirmedInfinitePayPayment[\s\S]+creator_club_subscriptions/, 'A ativação deve ocorrer somente após validar o pagamento oficial.');
assert.match(webhook, /status: 'active'[\s\S]+expires_at/, 'O webhook deve ativar a assinatura com vencimento.');

const download = readFileSync('src/app/api/aluno/materiais/[productId]/download/route.ts', 'utf8');
assert.match(download, /creator_club_subscriptions[\s\S]+\.eq\('status', 'active'\)[\s\S]+\.gt\('expires_at'/, 'O download deve exigir assinatura ativa e não expirada.');
assert.match(download, /\.eq\('creator_clubs.club_type', requestedType === 'plr' \? 'plr' : 'final'\)/, 'Uma assinatura final não pode liberar o arquivo PLR.');
assert.match(download, /clubAccess && requestedType === 'plr'\) isPlrPurchase = true/, 'Uma assinatura PLR ativa deve autorizar a entrega PLR.');

const manager = readFileSync('src/app/api/creator-clubs/route.ts', 'utf8');
assert.match(manager, /\.from\('creator_clubs'\)\.insert\(payload\)/, 'O criador deve conseguir cadastrar novos clubes sem substituir os anteriores.');
assert.match(manager, /export async function DELETE[\s\S]+status: 'archived'/, 'Clubes com vendas devem ser arquivados para preservar o histórico.');
assert.match(manager, /paid_sales_count/, 'A gestão deve informar vendas antes da exclusão ou do arquivamento.');

const multiClubMigration = readFileSync('supabase/migrations/20261001_allow_multiple_creator_clubs.sql', 'utf8');
assert.match(multiClubMigration, /drop constraint if exists creator_clubs_store_id_key/, 'A migration deve remover a limitação de um clube por loja.');

const storefront = readFileSync('src/app/loja/[slug]/themes/ThemeDefault.tsx', 'utf8');
assert.match(storefront, /Clubes do Criador[\s\S]+`\/clube\/\$\{club\.slug\}`/, 'A loja pública deve listar os clubes e abrir a página detalhada correspondente.');

console.log('Fluxo do Clube do Criador verificado com sucesso.');
