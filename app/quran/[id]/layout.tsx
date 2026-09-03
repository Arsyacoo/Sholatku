import type { Metadata } from 'next';
import { SURAH_LIST } from '@/lib/quran/surah-list';

interface SurahLayoutProps {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: SurahLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const surah = SURAH_LIST.find((item) => item.number === Number(id));
  if (!surah) {
    return { title: 'Surat tidak ditemukan', robots: { index: false, follow: false } };
  }

  const title = `${surah.name} — ${surah.translation}`;
  return {
    title: { absolute: `${title} | Sholatku` },
    description: `Baca Surat ${surah.name} (${surah.translation}) lengkap dengan teks Arab, transliterasi, terjemahan, dan audio murottal.`,
    alternates: { canonical: `/quran/${surah.number}` },
    openGraph: {
      type: 'article',
      title: `${title} | Sholatku`,
      description: `Baca dan dengarkan Surat ${surah.name} di Sholatku.`,
    },
  };
}

export default function SurahLayout({ children }: SurahLayoutProps) {
  return children;
}
