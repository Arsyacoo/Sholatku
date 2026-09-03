import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Jadwal Ramadan & Imsakiyah | Sholatku' },
  description: 'Jadwal imsakiyah Ramadan dengan pengingat imsak dan berbuka sesuai lokasi Anda.',
  alternates: { canonical: '/ramadan' },
};

export default function RamadanLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
