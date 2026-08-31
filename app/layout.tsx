import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaProvider } from '@/components/layout/PwaProvider';

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
  maximumScale: 1,
  userScalable: false,
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
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-surface-50 dark:bg-surface-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-primary-500 selection:text-white pb-20 md:pb-0">
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
