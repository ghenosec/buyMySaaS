import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Providers } from '@/components/providers';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' });
export const metadata: Metadata = {
  metadataBase: new URL(process.env.WEB_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Buy My SaaS — Produtos indie que valem descobrir',
    template: '%s — Buy My SaaS',
  },
  description:
    'Descubra, avalie e apoie SaaS independentes criados por makers brasileiros.',
  icons: {
    icon: '/logo.ico',
    shortcut: '/logo.ico',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Buy My SaaS',
    description:
      'Seu próximo SaaS favorito pode ter sido feito por uma pessoa independente.',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: '/og.png', width: 1744, height: 918, alt: 'Buy My SaaS' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={manrope.variable} suppressHydrationWarning>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
