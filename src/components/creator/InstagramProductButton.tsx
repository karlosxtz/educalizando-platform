import Link from 'next/link';
import { Camera as Instagram } from 'lucide-react';
export default function InstagramProductButton({ productId, published }: { productId: string; published: boolean }) {
  const style = 'mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-pink-600 px-3 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-700';
  if (!published) return <button disabled title="Publique o material antes de criar a divulgação." className={style + ' opacity-40'}><Instagram className="h-4 w-4" />Criar Story ou Feed</button>;
  return <Link prefetch={false} href={`/dashboard/instagram?produto=${encodeURIComponent(productId)}&formato=story`} className={style}><Instagram className="h-4 w-4" />Criar Story ou Feed</Link>;
}
