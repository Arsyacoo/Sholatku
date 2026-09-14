import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { PrivacyPolicyContent } from '@/components/privacy/PrivacyPolicyContent';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Kebijakan privasi Sholatku dan penjelasan penggunaan data aplikasi.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full px-4 py-8 pb-24 sm:px-6 md:py-12">
        <PrivacyPolicyContent />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
