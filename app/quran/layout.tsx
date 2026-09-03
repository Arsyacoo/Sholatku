import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Al-Qur’an Digital',
  description: 'Baca, cari, simpan, dan dengarkan 114 surat Al-Qur’an secara online.',
  alternates: { canonical: '/quran' },
};

export default function QuranLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
