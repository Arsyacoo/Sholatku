'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { LocationHeader } from '@/components/location/LocationHeader';
import { CitySearchModal } from '@/components/location/CitySearchModal';
import { LocationPermissionNotice } from '@/components/location/LocationPermissionNotice';
import { DateHeader } from '@/components/prayer/DateHeader';
import { NextPrayerHero } from '@/components/prayer/NextPrayerHero';
import { PrayerScheduleList } from '@/components/prayer/PrayerScheduleList';
import { useLocation } from '@/hooks/useLocation';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useNextPrayer } from '@/hooks/useNextPrayer';
import { usePrayerReminders } from '@/hooks/usePrayerReminders';
import { useRamadan } from '@/hooks/useRamadan';
import { getDefaultPrayerReminderSettings, getDefaultRamadanPreferences, getPrayerReminderSettings, getRamadanPreferences, getSavedSettings } from '@/lib/storage/preferences';
import { DEFAULT_SETTINGS } from '@/lib/prayer/constants';
import { RamadanHomeCard } from '@/components/prayer/RamadanHomeCard';
import type { PrayerReminderSettings, RamadanPreferences, UserSettings } from '@/types';

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dismissNotice, setDismissNotice] = useState(false);

  // Settings from storage
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [reminderSettings, setReminderSettings] = useState<PrayerReminderSettings>(getDefaultPrayerReminderSettings);
  const [ramadanPreferences, setRamadanPreferences] = useState<RamadanPreferences>(getDefaultRamadanPreferences);

  useEffect(() => {
    setSettings(getSavedSettings());
    setReminderSettings(getPrayerReminderSettings());
    setRamadanPreferences(getRamadanPreferences());
  }, []);

  // Location Hook
  const {
    location,
    status: geoStatus,
    errorMessage: geoError,
    selectCity,
    detectLocation,
  } = useLocation();

  // Prayer Times Hook
  const {
    schedule,
    isLoading: isPrayerLoading,
    isRefreshing,
    error: prayerError,
    refresh: refreshSchedule,
  } = usePrayerTimes(location, settings);

  // Next Prayer & Countdown Hook
  const nextPrayerInfo = useNextPrayer(schedule);
  const ramadan = useRamadan(schedule, location, settings, ramadanPreferences);

  useEffect(() => {
    const handleReminderSettingsChange = (event: Event) => {
      const detail = (event as CustomEvent<PrayerReminderSettings>).detail;
      setReminderSettings(detail || getPrayerReminderSettings());
    };
    window.addEventListener('sholatku:prayer-reminders-changed', handleReminderSettingsChange);
    return () => window.removeEventListener('sholatku:prayer-reminders-changed', handleReminderSettingsChange);
  }, []);

  useEffect(() => {
    const handleRamadanPreferencesChange = (event: Event) => {
      const detail = (event as CustomEvent<RamadanPreferences>).detail;
      setRamadanPreferences(detail || getRamadanPreferences());
    };
    window.addEventListener('sholatku:ramadan-preferences-changed', handleRamadanPreferencesChange);
    return () => window.removeEventListener('sholatku:ramadan-preferences-changed', handleRamadanPreferencesChange);
  }, []);

  usePrayerReminders({ schedule, location, settings, reminderSettings, ramadanPreferences });

  return (
    <div className="flex-1 flex flex-col">
      <Navbar location={location} onOpenLocationModal={() => setIsSearchOpen(true)} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Location selector header */}
        <LocationHeader
          location={location}
          onOpenSearch={() => setIsSearchOpen(true)}
          onRefresh={refreshSchedule}
          isRefreshing={isRefreshing}
        />

        {/* Location Permission / Error Alert (if any) */}
        {!dismissNotice && (
          <LocationPermissionNotice
            status={geoStatus}
            errorMessage={geoError}
            onOpenSearch={() => setIsSearchOpen(true)}
            onDismiss={() => setDismissNotice(true)}
          />
        )}

        {/* Date Display */}
        <DateHeader schedule={schedule} />

        {/* Next Prayer Hero Card */}
        <NextPrayerHero
          prayerInfo={nextPrayerInfo}
          isLoading={isPrayerLoading && !schedule}
        />

        {ramadan.status && ramadan.timing && ramadan.context && (
          <RamadanHomeCard status={ramadan.status} timing={ramadan.timing} context={ramadan.context} />
        )}

        {/* Today's 6 Prayer Schedules */}
        <div className="pt-2">
          <PrayerScheduleList
            schedule={schedule}
            nextPrayerInfo={nextPrayerInfo}
            isLoading={isPrayerLoading && !schedule}
            error={prayerError}
            onRetry={refreshSchedule}
          />
        </div>
      </main>

      <Footer />
      <BottomNav />

      {/* City Search & GPS Modal */}
      <CitySearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentLocation={location}
        onSelectCity={selectCity}
        onDetectLocation={detectLocation}
        isDetecting={geoStatus === 'requesting'}
      />
    </div>
  );
}
