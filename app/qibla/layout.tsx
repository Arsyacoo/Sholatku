import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arah Kiblat',
  description: 'Kompas arah kiblat berdasarkan koordinat lokasi Anda dan arah utara sejati.',
  alternates: { canonical: '/qibla' },
};

export default function QiblaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
