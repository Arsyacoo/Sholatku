'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { QuranDisplaySettings } from '@/types';
import { QARI_OPTIONS } from '@/hooks/useQuranAudio';
import { Type, Volume2, Globe, Eye } from 'lucide-react';

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
  const update = (partial: Partial<QuranDisplaySettings>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan Tampilan Al-Qur'an" maxWidth="md">
      <div className="space-y-6">
        {/* Arabic Font Size Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Type className="w-4 h-4 text-primary-600" />
              <span>Ukuran Teks Arab ({settings.arabicFontSize}px)</span>
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
            <span>Kecil (20px)</span>
            <span>Standar (28px)</span>
            <span>Besar (44px)</span>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="space-y-3 pt-4 border-t border-surface-200 dark:border-surface-800">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
            Pilihan Konten
          </label>

          {/* Toggle Translation */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-primary-600" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Terjemahan Kemenag RI
                </div>
                <div className="text-[11px] text-slate-500">Tampilkan arti bahasa Indonesia</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => update({ showTranslation: !settings.showTranslation })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showTranslation ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'
              }`}
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
                  Transliterasi Latin
                </div>
                <div className="text-[11px] text-slate-500">Teks panduan bacaan latin</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => update({ showLatin: !settings.showLatin })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showLatin ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'
              }`}
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
            <span>Pilihan Qari Murottal</span>
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
                >
                  <div>
                    <div className="text-xs text-slate-900 dark:text-slate-100">{qari.name}</div>
                    <div className="text-[10px] text-slate-500">{qari.subname}</div>
                  </div>
                  {isSelected && (
                    <span className="text-primary-600 text-xs font-bold">Terpilih</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
