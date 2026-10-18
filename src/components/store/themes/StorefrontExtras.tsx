'use client';
import Link from '@/components/OnDemandLink';
import CatalogImage from '@/components/ui/CatalogImage';
import { readableProductDescription } from '@/lib/product-description';
import type { StoreThemeProps } from '@/lib/types';
import { storefrontPrice } from './StorefrontProductCard';
import styles from './StorefrontTheme.module.css';

export default function StorefrontExtras({ store, kits, clubs }: Pick<StoreThemeProps, 'store' | 'kits' | 'clubs'>) {
  return <>
    {clubs.length > 0 && <section aria-labelledby="storefront-clubs"><div className={styles.sectionHeader}><h2 id="storefront-clubs" className={styles.sectionTitle}>Clubes da loja</h2><Link href="/cliente/clubes" className={styles.muted}>Acessar meus clubes →</Link></div><div className={styles.extraGrid}>{clubs.map(club => <Link key={club.id} href={'/clube/' + encodeURIComponent(club.slug)} className={styles.extra}>{club.cover_url && <CatalogImage src={club.cover_url} alt={club.name} width={180} height={200} />}<div className="min-w-0"><h3>{club.name}</h3><p className="line-clamp-2">{readableProductDescription(club.description)}</p><p>{club.material_count} {club.club_type === 'plr' ? 'materiais com licença PLR' : 'materiais incluídos'}</p><strong>{storefrontPrice(club.monthly_price)} / 30 dias</strong></div></Link>)}</div></section>}
    {kits.length > 0 && <section aria-labelledby="storefront-kits"><div className={styles.sectionHeader}><h2 id="storefront-kits" className={styles.sectionTitle}>Kits e combos</h2></div><div className={styles.extraGrid}>{kits.map(kit => <Link key={kit.id} href={`/loja/${encodeURIComponent(store.slug)}/kit/${encodeURIComponent(kit.id)}`} className={styles.extra}>{kit.capa_url && <CatalogImage src={kit.capa_url} alt={kit.titulo} width={180} height={200} />}<div className="min-w-0"><h3>{kit.titulo}</h3>{kit.descricao && <p className="line-clamp-2">{readableProductDescription(kit.descricao)}</p>}<strong>{storefrontPrice(kit.preco_kit)}</strong><p>Ver materiais incluídos →</p></div></Link>)}</div></section>}
    {store.author_bio && <section className={styles.about} aria-labelledby="storefront-author">{store.author_image_url && <CatalogImage src={store.author_image_url} alt={'Criador da loja ' + store.nome_loja} width={100} height={100} />}<div className="min-w-0"><h2 id="storefront-author" className={styles.sectionTitle}>Por trás dos materiais</h2><p>{store.author_bio}</p></div></section>}
  </>;
}
