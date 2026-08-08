import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Educalizando — Venda seus Materiais Didáticos Digitais',
  description:
    'A plataforma definitiva para professores, criadores de conteúdo e editoras venderem apostilas em PDF, e-books esquematizados, simulados e videoaulas com PIX instantâneo e área de membros.',
  keywords: [
    'venda de e-books didáticos',
    'plataforma para professores',
    'vender apostilas em PDF',
    'Hotmart para educação',
    'Kiwify para professores',
    'Educalizando',
    'área de membros com certificado'
  ],
  authors: [{ name: 'Educalizando Plataforma Digital' }],
  openGraph: {
    title: 'Educalizando — Venda seus Materiais Didáticos e Lucre Mais',
    description:
      'Transforme suas apostilas em PDF, e-books e videoaulas em uma fonte de renda recorrente com PIX instantâneo e loja própria.',
    url: 'https://educalizando.com.br',
    siteName: 'Educalizando',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Educalizando — Venda seus Materiais Didáticos',
    description:
      'Crie sua loja grátis e venda apostilas, e-books e cursos com PIX instantâneo.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fontSans.variable} scroll-smooth`}>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
