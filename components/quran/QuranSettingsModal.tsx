'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import {
  QuranDisplaySettings,
  QuranPlaybackRate,
  QURAN_PLAYBACK_RATES,
} from '@/types';
import { QARI_OPTIONS } from '@/hooks/useQuranAudio';
import { Type, Volume2, VolumeX, Gauge, Globe, Eye } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface QuranSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: QuranDisplaySettings;
  onChange: (settings: QuranDisplaySettings) => void;
}

export const QuranSettingsModal: React.FC<QuranSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChange,
}) => {
  const { t, language } = useLanguage();
  const formatRate = (rate: number) => (language === 'en' ? String(rate) : String(rate).replace('.', ','));
  const update = (partial: Partial<QuranDisplaySettings>) => {
    onChange({ ...settings, ...partial });
  };

  const isMuted = settings.audioMuted || settings.audioVolume === 0;

  const handleVolumeChange = (volume: number) => {
    update({
      audioVolume: volume,
      audioMuted: volume === 0,
    });
  };

  const handleToggleMute = () => {
    update({
      audioVolume: isMuted && settings.audioVolume === 0 ? 100 : settings.audioVolume,
      audioMuted: !isMuted,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("Pengaturan Al-Qur'an", 'Quran settings')} maxWidth="md">
      <div className="space-y-6">
        {/* Arabic Font Size Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Type className="w-4 h-4 text-primary-600" />
              <span>{t('Ukuran Teks Arab', 'Arabic text size')} ({settings.arabicFontSize}px)</span>
            </label>
            <span className="font-arabic text-lg font-bold text-slate-800 dark:text-slate-200">
              بِسْمِ اللَّهِ
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="44"
            step="2"
            value={settings.arabicFontSize}
            onChange={(e) => update({ arabicFontSize: parseInt(e.target.value, 10) })}
            className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>{t('Kecil', 'Small')} (20px)</span>
            <span>{t('Standar', 'Standard')} (28px)</span>
            <span>{t('Besar', 'Large')} (44px)</span>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="space-y-3 pt-4 border-t border-surface-200 dark:border-surface-800">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
            {t('Pilihan Konten', 'Content options')}
          </label>

          {/* Toggle Translation */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-primary-600" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {t('Terjemahan Kemenag RI', 'English translation (Saheeh International)')}
                </div>
                <div className="text-[11px] text-slate-500">{t('Tampilkan arti bahasa Indonesia', 'Show the English meaning')}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => update({ showTranslation: !settings.showTranslation })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showTranslation ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'
              }`}
              aria-label={t('Tampilkan terjemahan Kemenag RI', 'Show English translation')}
              aria-pressed={settings.showTranslation}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showTranslation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle Latin Transliteration */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-primary-600" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {t('Transliterasi Latin', 'Latin transliteration')}
                </div>
                <div className="text-[11px] text-slate-500">{t('Teks panduan bacaan latin', 'Pronunciation guide in Latin script')}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => update({ showLatin: !settings.showLatin })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showLatin ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'
              }`}
              aria-label={t('Tampilkan transliterasi Latin', 'Show Latin transliteration')}
              aria-pressed={settings.showLatin}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showLatin ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Qari Selection */}
        <div className="space-y-3 pt-4 border-t border-surface-200 dark:border-surface-800">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary-600" />
            <span>{t('Pilihan Qari Murottal', 'Recitation reciter')}</span>
          </label>

          <div className="grid grid-cols-1 gap-2">
            {QARI_OPTIONS.map((qari) => {
              const isSelected = settings.selectedQari === qari.id;
              return (
                <button
                  key={qari.id}
                  type="button"
                  onClick={() => update({ selectedQari: qari.id })}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-950/70 border-2 border-primary-500 shadow-2xs font-bold'
                      : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:bg-surface-50'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div>
                    <div className="text-xs text-slate-900 dark:text-slate-100">{qari.name}</div>
                    <div className="text-[10px] text-slate-500">{t(qari.subname, qari.subnameEn)}</div>
                  </div>
                  {isSelected && (
                    <span className="text-primary-600 text-xs font-bold">{t('Terpilih', 'Selected')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Playback Preferences */}
        <div className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Gauge className="w-4 h-4 text-primary-600" aria-hidden="true" />
              <span>{t('Audio Murottal', 'Recitation audio')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                'Volume dan kecepatan ini berlaku untuk semua surat dan tersimpan di perangkat ini.',
                'This volume and speed apply to every surah and are saved on this device.'
              )}
            </p>
          </div>

          <div className="space-y-2.5 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="quran-settings-volume" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Volume
              </label>
              <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                {isMuted ? t('Bisu', 'Muted') : `${settings.audioVolume}%`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  isMuted
                    ? 'bg-surface-200 dark:bg-surface-700 text-slate-600 dark:text-slate-300'
                    : 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                }`}
                aria-label={isMuted ? t('Aktifkan suara', 'Unmute') : t('Bisukan audio', 'Mute audio')}
                aria-pressed={isMuted}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                id="quran-settings-volume"
                type="range"
                min="0"
                max="100"
                step="1"
                value={settings.audioVolume}
                onChange={(event) => handleVolumeChange(Number(event.target.value))}
                className="w-full h-2 rounded-full cursor-pointer accent-primary-600 bg-surface-200 dark:bg-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-valuetext={
                  isMuted
                    ? t(`Bisu, volume tersimpan ${settings.audioVolume} persen`, `Muted, saved volume ${settings.audioVolume} percent`)
                    : t(`${settings.audioVolume} persen`, `${settings.audioVolume} percent`)
                }
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t('Kecepatan bacaan', 'Playback speed')}
            </legend>
            <div className="grid grid-cols-4 gap-2">
              {QURAN_PLAYBACK_RATES.map((rate) => {
                const isSelected = settings.playbackRate === rate;
                const label = `${formatRate(rate)}×`;

                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => update({ playbackRate: rate as QuranPlaybackRate })}
                    className={`min-h-10 rounded-xl text-xs font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-100 dark:bg-surface-800 text-slate-700 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                    }`}
                    aria-pressed={isSelected}
                    aria-label={t(`Kecepatan ${formatRate(rate)} kali`, `Speed ${formatRate(rate)} times`)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </div>
    </Modal>
  );
};
