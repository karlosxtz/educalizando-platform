import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import WhatsAppButton from '@/components/WhatsAppButton';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#093b6c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.educalizando.com.br'),
  title: 'Educalizando — Plataforma Digital para Materiais Didáticos',
  description:
    'A Educalizando é a plataforma para compra e venda de materiais e produtos digitais educacionais. Venda apostilas em PDF, e-books esquematizados, simulados e videoaulas com PIX instantâneo.',
  manifest: '/manifest.json',
  applicationName: 'Educalizando',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Educalizando',
  },
  icons: {
    icon: [
      { url: '/branding/favicon.ico' },
      { url: '/branding/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/branding/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/branding/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/branding/favicon.ico',
    apple: '/branding/apple-touch-icon.png',
  },
  keywords: [
    'venda de infoprodutos e e-books',
    'plataforma para professores',
    'vender apostilas em PDF',
    'materiais didaticos digitais',
    'Educalizando',
    'área de membros com certificado'
  ],
  authors: [{ name: 'Educalizando Plataforma Digital' }],
  openGraph: {
    title: 'Educalizando — Plataforma Digital Educacional',
    description:
      'A Educalizando é a plataforma para compra e venda de materiais e produtos digitais educacionais.',
    url: 'https://educalizando.com.br',
    siteName: 'Educalizando',
    images: [
      {
        url: '/branding/logo-og.png',
        width: 1200,
        height: 630,
        alt: 'Educalizando',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Educalizando — Plataforma Digital Educacional',
    description:
      'A Educalizando é a plataforma para compra e venda de materiais e produtos digitais educacionais.',
    images: ['/branding/logo-og.png'],
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
    <html lang="pt-BR" className={`${fontSans.variable} scroll-smooth overflow-x-hidden`}>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen overflow-x-hidden relative w-full">
        {children}
        <PWAInstallPrompt />
        <WhatsAppButton />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
