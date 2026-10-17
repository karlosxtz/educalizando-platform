import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Segurança da conta | Educalizando', robots: { index: false, follow: false } };
export default function SecurityLayout({ children }: { children: React.ReactNode }) { return children; }
