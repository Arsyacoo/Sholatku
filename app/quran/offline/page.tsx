import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { OfflineManager } from '@/components/quran/offline/OfflineManager';

export default function QuranOfflinePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <OfflineManager />
      <Footer />
      <BottomNav />
    </div>
  );
}

