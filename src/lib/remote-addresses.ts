import { lookup } from 'node:dns/promises';

export async function resolveRemoteAddresses(hostname: string) {
  return lookup(hostname, { all: true });
}
