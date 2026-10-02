import WhatsAppButton from '@/components/WhatsAppButton';
import { DEFAULT_SOCIAL_IMAGE,DEFAULT_SOCIAL_IMAGE_ALT,SITE_URL } from '@/lib/seo';
import type { Metadata,Viewport } from 'next';
import Script from 'next/script';
import { Toaster } from 'sonner';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#093b6c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
      { url: '/branding/favicon.ico?v=3' },
      { url: '/branding/favicon-16.png?v=3', sizes: '16x16', type: 'image/png' },
      { url: '/branding/favicon-32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/branding/favicon-48.png?v=3', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/branding/favicon.ico?v=3',
    apple: '/branding/apple-touch-icon.png?v=3',
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
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Educalizando — Plataforma Digital Educacional',
    description:
      'A Educalizando é a plataforma para compra e venda de materiais e produtos digitais educacionais.',
    url: 'https://www.educalizando.com.br',
    siteName: 'Educalizando',
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt: DEFAULT_SOCIAL_IMAGE_ALT,
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
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
};

import AffiliateTracker from '@/components/affiliates/AffiliateTracker';
import { CartProvider } from '@/components/store/CartContext';
import CartSidebar from '@/components/store/CartSidebar';
import { Suspense } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth overflow-x-hidden" data-scroll-behavior="smooth">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen overflow-x-hidden relative w-full">
        <Script id="creator-pwa-install-capture" strategy="beforeInteractive">{`
          (() => {
            if (!/^\\/dashboard(?:\\/|$)/.test(window.location.pathname)) return;

            window.addEventListener('beforeinstallprompt', (event) => {
              event.preventDefault();
              window.__creatorPwaInstallPrompt = event;
              window.dispatchEvent(new Event('creator-pwa-install-ready'));
            });

            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/dashboard-sw.js', { scope: '/dashboard' }).catch(() => {});
            }
          })();
        `}</Script>
        <CartProvider>
          <CartSidebar />
          {children}
          <Suspense fallback={null}>
            <AffiliateTracker />
          </Suspense>
          <WhatsAppButton />
          <Toaster position="bottom-right" richColors />
        </CartProvider>
      </body>
    </html>
  );
}
