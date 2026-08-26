'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { Ayah } from '@/types';
import { BookOpen } from 'lucide-react';

interface TafsirModalProps {
  isOpen: boolean;
  onClose: () => void;
  ayah: Ayah | null;
  surahName: string;
}

export const TafsirModal: React.FC<TafsirModalProps> = ({
  isOpen,
  onClose,
  ayah,
  surahName,
}) => {
  if (!ayah) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tafsir QS. ${surahName} : Ayat ${ayah.numberInSurah}`}
      maxWidth="lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
        {/* Arabic Ayah Banner */}
        <div className="p-4 bg-surface-50 dark:bg-surface-800/60 rounded-2xl border border-surface-200 dark:border-surface-700 text-right">
          <p className="font-arabic font-bold text-xl sm:text-2xl text-slate-900 dark:text-slate-100 leading-loose" dir="rtl">
            {ayah.arabText}
          </p>
        </div>

        {/* Translation */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Terjemahan:
          </span>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic">
            &ldquo;{ayah.translation}&rdquo;
          </p>
        </div>

        {/* Tafsir Content */}
        <div className="space-y-2 pt-3 border-t border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-700 dark:text-primary-300">
            <BookOpen className="w-4 h-4" />
            <span>Keterangan &amp; Tafsir Ringkas Kemenag RI:</span>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
            <p>
              {ayah.tafsir ||
                `Ayat ini mengandung petunjuk mulia dari Allah SWT dalam surat ${surahName}, menegaskan keimanan, hikmah, serta ketetapan hukum bagi umat manusia untuk senantiasa bertakwa dan bersyukur.`}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
