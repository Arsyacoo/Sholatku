'use client';

import React from 'react';
import { Madhab } from '@/types';
import { Check } from 'lucide-react';

interface MadhabSelectorProps {
  value: Madhab;
  onChange: (madhab: Madhab) => void;
}

export const MadhabSelector: React.FC<MadhabSelectorProps> = ({ value, onChange }) => {
  const options = [
    {
      id: 'shafii' as Madhab,
      title: 'Syafi\'i, Maliki, Hanbali (Standar)',
      desc: 'Waktu Ashar dimulai saat panjang bayangan benda sama dengan tinggi aslinya (1x).',
    },
    {
      id: 'hanafi' as Madhab,
      title: 'Hanafi',
      desc: 'Waktu Ashar dimulai saat panjang bayangan benda dua kali tinggi aslinya (2x).',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">
          Metode Waktu Ashar (Madhab)
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Mempengaruhi waktu masuknya sholat Ashar berdasarkan rasio panjang bayangan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`p-4 rounded-2xl text-left transition-all ${
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-950/70 border-2 border-primary-500 shadow-xs'
                  : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {opt.title}
                </span>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'border border-surface-300 dark:border-surface-700'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
