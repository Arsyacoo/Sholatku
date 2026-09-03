import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Pengaturan | Sholatku' },
  description: 'Atur tema, metode hisab, madhab, koreksi waktu, dan pengingat Sholatku.',
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
