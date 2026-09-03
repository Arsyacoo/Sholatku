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

export const metadata: Metadata = {
  title: 'Sholatku — Jadwal Waktu Sholat & Arah Kiblat Akurat',
  description:
    'Aplikasi jadwal waktu sholat harian, hitung mundur adzan otomatis, arah kiblat presisi, dan kalender hisab bulanan untuk wilayah Indonesia dan dunia.',
  keywords: [
    'jadwal sholat',
    'waktu sholat hari ini',
    'subuh dzuhur ashar maghrib isya',
    'arah kiblat',
    'jadwal imsakiyah',
    'kemenag',
  ],
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
      } else {
        document.documentElement.classList.remove('dark');
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
      <body className="min-h-screen flex flex-col font-sans bg-surface-50 dark:bg-surface-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-primary-500 selection:text-white pb-20 md:pb-0">
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
