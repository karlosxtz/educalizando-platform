import type { Metadata } from 'next';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import GlossaryBrowser from '@/components/glossary/GlossaryBrowser';
import { glossaryTerms } from '@/lib/glossary';

export const metadata: Metadata = { title: 'Glossário Pedagógico | Educalizando', description: 'Entenda termos essenciais da educação, da BNCC e dos materiais pedagógicos digitais.' };

export default function GlossarioPage() {
  return <div className="flex min-h-screen flex-col bg-slate-50"><MarketplaceHeader /><main className="flex-1"><GlossaryBrowser terms={glossaryTerms} /></main><Footer /></div>;
}
