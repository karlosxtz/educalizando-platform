import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { flushPublicRevalidations, rotatePublicCacheRevision } from '@/lib/public-cache-runtime';

/** Called only after an authorized catalogue write. Does not change saved data. */
export async function invalidatePublicCatalog() {
  // Invalidate framework data first; only then publish the new edge namespace.
  try {
    await revalidateTag('public-catalog', { expire: 0 });
    await revalidatePath('/', 'layout');
    await flushPublicRevalidations();
    await rotatePublicCacheRevision();
    return true;
  } catch {
    console.warn('[Cache] Cadastro salvo; invalidação pública pendente.');
    return false;
  }
}
