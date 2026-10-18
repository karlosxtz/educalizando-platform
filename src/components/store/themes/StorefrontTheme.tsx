'use client';
import { useState, type CSSProperties } from 'react';
import Link from '@/components/OnDemandLink';
import { useCart } from '@/components/store/CartContext';
import StoreCatalogControls from '@/components/store/StoreCatalogControls';
import StoreCatalogMoreButton from '@/components/store/StoreCatalogMoreButton';
import { ShoppingBag } from 'lucide-react';
import { storeThemeColors, type NewStoreThemeId } from '@/lib/store-themes';
import type { StoreThemeProps } from '@/lib/types';
import StorefrontHero from './StorefrontHero';
import StorefrontProductCard from './StorefrontProductCard';
import StorefrontExtras from './StorefrontExtras';
import styles from './StorefrontTheme.module.css';

export default function StorefrontTheme(props: StoreThemeProps & { theme: NewStoreThemeId }) {
  const { store, theme, filteredProducts, selectedCategory, selectedEducation, selectedCollection, searchFilter } = props;
  const { itemCount, setIsOpen } = useCart();
  const [window, setWindow] = useState({ key: '', count: 12 });
  const key = [theme, selectedCategory, selectedEducation, selectedCollection, searchFilter].join('|');
  const count = window.key === key ? window.count : 12;
  const palette = storeThemeColors(theme, store.cor_primaria);
  return <div className={styles.root} data-theme={theme} style={{ '--accent': palette.accent, '--accent-fg': palette.foreground } as CSSProperties}>
    <div className={styles.trust}><div><span>Loja independente na Educalizando</span><Link href={'/cliente/login?from=' + encodeURIComponent(store.slug)}>Já comprou? Acesse seus materiais</Link></div></div>
    <nav aria-label="Navegação da loja" className={styles.nav}><Link href="/">← Marketplace Educalizando</Link><div><Link href="#catalogo-materiais">Catálogo</Link><button type="button" onClick={() => setIsOpen(true)} aria-label={'Abrir carrinho com ' + itemCount + ' itens'}><ShoppingBag aria-hidden="true" className="h-4 w-4" />Carrinho ({itemCount})</button></div></nav>
    <div className={styles.body}>
      <StorefrontHero store={store} theme={theme} />
      <main id="catalogo-materiais" className={styles.catalog}>
        <div className={styles.controls}><StoreCatalogControls {...props} variant={theme === 'noite' ? 'netflix' : 'default'} /></div>
        <section aria-labelledby="storefront-results"><div className={styles.sectionHeader}><h2 id="storefront-results" className={styles.sectionTitle}>{selectedCollection === 'plr' ? 'Licenças PLR' : selectedCollection === 'new' ? 'Novidades da loja' : selectedCollection === 'popular' ? 'Materiais mais procurados' : 'Explore os materiais'}</h2><p role="status" className={styles.muted}>{filteredProducts.length} {filteredProducts.length === 1 ? 'material encontrado' : 'materiais encontrados'}</p></div>
          {filteredProducts.length ? <><div className={styles.grid}>{filteredProducts.slice(0, count).map(product => <StorefrontProductCard key={product.id + '-' + product.listing_mode} store={store} product={product} categories={props.categories} levels={props.educationLevels} />)}</div><StoreCatalogMoreButton remaining={Math.max(0, filteredProducts.length - count)} onMore={() => setWindow({ key, count: count + 12 })} /></> : <div className={styles.empty}><h3 className={styles.sectionTitle}>Nenhum material por aqui</h3><p className={styles.muted}>Tente outra busca ou limpe os filtros para explorar o catálogo desta loja.</p><button type="button" className={styles.cta + ' mt-5'} onClick={() => { props.setSearchFilter(''); props.setSelectedCategory('all'); props.setSelectedEducation('all'); props.setSelectedCollection('all'); }}>Limpar filtros</button></div>}
        </section>
        <StorefrontExtras store={store} kits={props.kits} clubs={props.clubs} />
      </main>
    </div>
    <footer className={styles.footer}><span>{store.nome_loja}</span><Link href="/">Uma loja na Educalizando →</Link></footer>
  </div>;
}
