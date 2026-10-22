'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { CitySearchModal } from '@/components/location/CitySearchModal';
import { NearbyMosqueList } from '@/components/mosques/NearbyMosqueList';
import { useLocation } from '@/hooks/useLocation';
import { useLanguage } from '@/hooks/useLanguage';

export default function MosquesPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { t } = useLanguage();
  const { location, isHydrated, selectCity, detectLocation, status } = useLocation();

  return (
    <div className="flex-1 flex flex-col">
      <Navbar location={location} onOpenLocationModal={() => setIsSearchOpen(true)} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <Link
              href="/qibla"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-surface-100 text-slate-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-slate-300"
              aria-label={t('Kembali ke Kiblat', 'Back to Qibla')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Masjid Terdekat', 'Nearby mosques')}</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('Masjid dan musala di sekitar Anda dari OpenStreetMap', 'Mosques and prayer rooms near you from OpenStreetMap')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-surface-50 transition-colors self-start sm:self-center shadow-2xs"
          >
            <MapPin className="w-4 h-4 text-primary-600" />
            <span>{location.displayName}</span>
          </button>
        </div>

        {/* Wait for the saved location so the default city is never searched first. */}
        {isHydrated && (
          <NearbyMosqueList location={location} onDetectLocation={detectLocation} isDetecting={status === 'requesting'} />
        )}
      </main>

      <Footer />
      <BottomNav />

      <CitySearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentLocation={location}
        onSelectCity={selectCity}
        onDetectLocation={detectLocation}
        isDetecting={status === 'requesting'}
      />
    </div>
  );
}
