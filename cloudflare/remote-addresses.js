import { resolve4, resolve6 } from 'node:dns/promises';
import { isIP } from 'node:net';

// Workers does not implement dns.lookup. Keep both address families and fail
// closed on resolver failures; callers still reject every private address.
export async function resolveRemoteAddresses(hostname) {
  const family = isIP(hostname);
  if (family) return [{ address: hostname, family }];
  const results = await Promise.allSettled([resolve4(hostname), resolve6(hostname)]);
  const addresses = [];
  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    if (result.status === 'fulfilled') {
      addresses.push(...result.value.map(address => ({ address, family: index ? 6 : 4 })));
    } else if (!['ENODATA', 'ENOTFOUND'].includes(result.reason?.code)) {
      throw new Error('Não foi possível verificar o endereço remoto com segurança.');
    }
  }
  if (!addresses.length) throw new Error('Nenhum endereço remoto encontrado.');
  return addresses;
}
