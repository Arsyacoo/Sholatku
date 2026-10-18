import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Masjid Terdekat | Sholatku' },
  description: 'Daftar masjid dan musala terdekat dari OpenStreetMap, lengkap dengan jarak dan arah.',
  alternates: { canonical: '/mosques' },
};

export default function MosquesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
