'use client';
import Link from '@/components/OnDemandLink';
import CatalogImage from '@/components/ui/CatalogImage';
import { ArrowDown, BookOpen } from 'lucide-react';
import { normalizeExternalUrl, type StoreSocialPlatform } from '@/lib/social-links';
import { getStoreWhatsAppUrl } from '@/lib/whatsapp';
import type { Store } from '@/lib/types';
import type { NewStoreThemeId } from '@/lib/store-themes';
import styles from './StorefrontTheme.module.css';

export default function StorefrontHero({ store, theme }: { store: Store; theme: NewStoreThemeId }) {
  const visual = <div className={styles.heroVisual}>{store.banner_url ? <CatalogImage thumbnail={false} src={store.banner_url} alt={'Banner de ' + store.nome_loja} width={1200} height={500} loading="eager" fetchPriority="high" className={styles.heroImage} /> : <BookOpen aria-hidden="true" />}</div>;
  return <header className={styles.hero}>
    {theme === 'estudio' && visual}
    <div className={styles.heroInner}>
      <p className={styles.eyebrow}>{theme === 'editorial' ? 'Acervo de materiais didáticos' : theme === 'brincar' ? 'Ideias para aprender e criar' : theme === 'noite' ? 'Explore a coleção' : theme === 'estudio' ? 'A loja do criador' : 'Materiais para sua próxima aula'}</p>
      <div className={styles.identity}>{store.logo_url ? <CatalogImage src={store.logo_url} alt={'Logo de ' + store.nome_loja} width={96} height={96} className={styles.logo} /> : <span aria-hidden="true" className={styles.logo + ' ' + styles.initial}>{store.nome_loja.charAt(0)}</span>}<h1 className={styles.title}>{store.nome_loja}</h1></div>
      {store.welcome_message && <p className={styles.welcome}>{store.welcome_message}</p>}
      {store.descricao && <p className={styles.description}>{store.descricao}</p>}
      <a href="#catalogo-materiais" className={styles.cta}>Explorar materiais<ArrowDown aria-hidden="true" className="h-4 w-4" /></a>
      <nav aria-label="Contatos da loja" className={styles.socials}>
        {(['instagram', 'youtube', 'tiktok', 'facebook', 'website'] as StoreSocialPlatform[]).map(platform => {
          const href = normalizeExternalUrl(store[platform], platform);
          return href ? <a key={platform} href={href} target="_blank" rel="noopener noreferrer">{platform === 'website' ? 'Site' : platform === 'youtube' ? 'YouTube' : platform === 'tiktok' ? 'TikTok' : platform.charAt(0).toUpperCase() + platform.slice(1)}</a> : null;
        })}
        {store.whatsapp && <a href={getStoreWhatsAppUrl(store.whatsapp, `Olá! Quero conhecer os materiais da loja ${store.nome_loja}.`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
        {store.exclusive_material_requests_enabled && <Link href={'/solicitar-material-exclusivo/' + encodeURIComponent(store.slug)}>Pedir material exclusivo</Link>}
      </nav>
    </div>
    {theme !== 'estudio' && visual}
  </header>;
}
