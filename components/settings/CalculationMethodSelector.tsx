'use client';

import React from 'react';
import { CalculationMethodId } from '@/types';
import { CALCULATION_METHODS } from '@/lib/prayer/constants';
import { Check } from 'lucide-react';

interface CalculationMethodSelectorProps {
  value: CalculationMethodId;
  onChange: (methodId: CalculationMethodId) => void;
}

export const CalculationMethodSelector: React.FC<CalculationMethodSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">
          Metode Hisab / Perhitungan
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Menentukan sudut elongasi matahari untuk waktu Subuh dan Isya sesuai otoritas resmi.
        </p>
      </div>

      <div className="space-y-2">
        {CALCULATION_METHODS.map((method) => {
          const isSelected = value === method.id;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={`w-full flex items-start justify-between p-3.5 rounded-2xl text-left transition-all ${
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-950/70 border-2 border-primary-500 shadow-xs'
                  : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700'
              }`}
            >
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {method.name}
                  </span>
                  {method.id === '20' && (
                    <span className="text-[10px] bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-semibold px-2 py-0.5 rounded-full">
                      Rekomendasi RI
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{method.description}</p>
                <span className="inline-block text-[11px] text-slate-400 font-medium mt-1">
                  Wilayah: {method.region}
                </span>
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'border border-surface-300 dark:border-surface-700'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
