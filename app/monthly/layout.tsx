import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jadwal Sholat Bulanan',
  description: 'Lihat jadwal waktu sholat dan imsakiyah sebulan penuh berdasarkan lokasi dan metode hisab pilihan Anda.',
  alternates: { canonical: '/monthly' },
};

export default function MonthlyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
