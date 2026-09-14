import type { MetadataRoute } from 'next';
import { SURAH_LIST } from '@/lib/quran/surah-list';

const PUBLIC_ROUTES = ['/', '/quran', '/monthly', '/qibla', '/ramadan', '/download'];

function toAbsoluteUrl(pathname: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return siteUrl ? new URL(pathname, siteUrl).toString() : pathname;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...PUBLIC_ROUTES,
    ...SURAH_LIST.map((surah) => `/quran/${surah.number}`),
  ];
  return routes.map((pathname) => ({ url: toAbsoluteUrl(pathname) }));
}
