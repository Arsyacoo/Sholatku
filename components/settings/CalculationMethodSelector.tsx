'use client';

import React from 'react';
import { CalculationMethodId } from '@/types';
import { CALCULATION_METHODS } from '@/lib/prayer/constants';
import { Check } from 'lucide-react';

interface CalculationMethodSelectorProps {
  value: CalculationMethodId;
  onChange: (methodId: CalculationMethodId) => void;
}

const splitMethodName = (name: string) => {
  const match = name.match(/^(.*?)\s*\((.+)\)$/);
  return match ? { primary: match[1], institution: match[2] } : { primary: name, institution: null };
};

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
          const { primary, institution } = splitMethodName(method.name);

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={`flex w-full items-start justify-between gap-3 rounded-2xl p-3.5 text-left transition-all ${
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-950/70 border-2 border-primary-500 shadow-xs'
                  : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="min-w-0">
                  <span className="block text-sm font-bold leading-5 text-slate-900 dark:text-slate-100">
                    {primary}
                  </span>
                  {institution && (
                    <span className="mt-0.5 block text-xs font-medium leading-4 text-slate-600 dark:text-slate-300">
                      ({institution})
                    </span>
                  )}
                  {method.id === '20' && (
                    <span className="mt-2 inline-flex whitespace-nowrap rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold leading-4 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300">
                      Rekomendasi RI
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{method.description}</p>
                <span className="mt-1.5 inline-block text-[11px] font-medium leading-4 text-slate-400">
                  Wilayah: {method.region}
                </span>
              </div>

              <div
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
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
