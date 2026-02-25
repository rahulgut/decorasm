import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/hooks/useCart';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://decorasm.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Decorasm — Curated Home Decor',
    template: '%s | Decorasm',
  },
  description:
    'Elegant, curated home decor that brings warmth and style to every space. Shop furniture, lighting, wall art, textiles, and accessories.',
  keywords: [
    'home decor', 'furniture', 'lighting', 'wall art',
    'textiles', 'accessories', 'curated home decor', 'interior design',
  ],
  icons: {
    icon: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Decorasm',
    title: 'Decorasm — Curated Home Decor',
    description:
      'Elegant, curated home decor that brings warmth and style to every space. Shop furniture, lighting, wall art, textiles, and accessories.',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Decorasm — Curated Home Decor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decorasm — Curated Home Decor',
    description:
      'Elegant, curated home decor that brings warmth and style to every space.',
    images: ['/og-default.jpg'],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Decorasm',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Elegant, curated home decor that brings warmth and style to every space.',
  };

  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Decorasm',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <CartProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-charcoal-800 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg"
          >
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
