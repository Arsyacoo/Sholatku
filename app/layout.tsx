import type { Metadata, Viewport } from 'next';
import { Amiri, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { PwaProvider } from '@/components/layout/PwaProvider';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

const amiri = Amiri({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-amiri',
  weight: ['400', '700'],
});

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const metadataBase = configuredSiteUrl ? new URL(configuredSiteUrl) : undefined;

const siteDescription =
  'Aplikasi jadwal waktu sholat harian, hitung mundur adzan otomatis, arah kiblat presisi, kalender bulanan, dan Al-Qur’an digital untuk dibaca serta didengarkan online.';

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'Sholatku — Jadwal Sholat & Al-Qur’an Digital',
    template: '%s | Sholatku',
  },
  description: siteDescription,
  applicationName: 'Sholatku',
  creator: 'Arsyacoo',
  publisher: 'Arsyacoo',
  keywords: [
    'jadwal sholat',
    'waktu sholat hari ini',
    'subuh dzuhur ashar maghrib isya',
    'arah kiblat',
    'jadwal imsakiyah',
    'kemenag',
  ],
  alternates: configuredSiteUrl ? { canonical: '/' } : undefined,
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Sholatku',
    title: 'Sholatku — Jadwal Sholat & Al-Qur’an Digital',
    description: siteDescription,
    ...(configuredSiteUrl ? { url: configuredSiteUrl } : {}),
    ...(configuredSiteUrl
      ? { images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Logo Sholatku' }] }
      : {}),
  },
  twitter: {
    card: 'summary',
    title: 'Sholatku — Jadwal Sholat & Al-Qur’an Digital',
    description: siteDescription,
    ...(configuredSiteUrl ? { images: ['/icon-512.png'] } : {}),
  },
  authors: [{ name: 'Sholatku Team' }],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sholatku',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0D9488',
};

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('sholatku_theme_mode');
      var isDark = false;
      if (saved === 'dark') {
        isDark = true;
      } else if (saved === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`scroll-smooth ${jakarta.variable} ${amiri.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-surface-50 dark:bg-surface-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-primary-500 selection:text-white">
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
