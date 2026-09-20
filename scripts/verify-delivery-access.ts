import assert from 'node:assert/strict';
import { getPurchaseAccess } from '../src/lib/purchase-access';

const appUrl = 'https://www.educalizando.com.br';
const customerAccess = getPurchaseAccess(false, appUrl);
const plrAccess = getPurchaseAccess(true, appUrl);

assert.equal(customerAccess.loginPath, '/cliente/login');
assert.equal(customerAccess.areaPath, '/cliente/dashboard');
assert.equal(
  customerAccess.url,
  'https://www.educalizando.com.br/cliente/login?returnTo=%2Fcliente%2Fdashboard',
);
assert.ok(!customerAccess.url.includes('/dashboard/plr/'));

assert.equal(plrAccess.loginPath, '/login');
assert.equal(plrAccess.areaPath, '/dashboard/plr/comprados');
assert.equal(
  plrAccess.url,
  'https://www.educalizando.com.br/login?returnTo=%2Fdashboard%2Fplr%2Fcomprados',
);
assert.ok(!plrAccess.url.includes('/cliente/'));

console.log('OK: o acesso de produto final e o acesso de licença PLR permanecem separados.');
