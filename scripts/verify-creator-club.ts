import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { creatorClubFinancials, CREATOR_CLUB_DURATION_DAYS } from '../src/lib/creator-club';

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

console.log('Fluxo do Clube do Criador verificado com sucesso.');
