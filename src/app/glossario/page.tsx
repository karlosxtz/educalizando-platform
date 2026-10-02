import Footer from '@/components/Footer';
import GlossaryBrowser from '@/components/glossary/GlossaryBrowser';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { glossaryTerms } from '@/lib/glossary';
import { socialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Glossário Pedagógico | Educalizando',
  description: 'Entenda termos essenciais da educação, da BNCC e dos materiais pedagógicos digitais.',
  alternates: { canonical: '/glossario' },
  ...socialMetadata({ title: 'Glossário Pedagógico | Educalizando', description: 'Consulte termos essenciais da educação, BNCC e materiais pedagógicos no glossário da Educalizando.', url: '/glossario' }),
};

export default function GlossarioPage() {
  return <div className="flex min-h-screen flex-col bg-slate-50"><MarketplaceHeader /><main className="flex-1"><GlossaryBrowser terms={glossaryTerms} /></main><Footer /></div>;
}
