'use client';

import React from 'react';

interface CountdownTimerProps {
  countdownStr: string; // "HH:mm:ss"
  remainingSeconds: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ countdownStr, remainingSeconds }) => {
  const parts = countdownStr.split(':');
  const hours = parts[0] || '00';
  const minutes = parts[1] || '00';
  const seconds = parts[2] || '00';

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 select-none" aria-label={`Sisa waktu: ${hours} jam ${minutes} menit ${seconds} detik`}>
      {/* Hours */}
      <div className="flex flex-col items-center">
        <div className="w-12 sm:w-14 h-11 sm:h-12 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 dark:border-white/10 font-mono text-xl sm:text-2xl font-bold tracking-tight">
          {hours}
        </div>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-white/70 mt-1">Jam</span>
      </div>

      <span className="font-mono text-lg font-bold text-white/60 mb-4 animate-pulse-subtle">:</span>

      {/* Minutes */}
      <div className="flex flex-col items-center">
        <div className="w-12 sm:w-14 h-11 sm:h-12 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 dark:border-white/10 font-mono text-xl sm:text-2xl font-bold tracking-tight">
          {minutes}
        </div>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-white/70 mt-1">Menit</span>
      </div>

      <span className="font-mono text-lg font-bold text-white/60 mb-4 animate-pulse-subtle">:</span>

      {/* Seconds */}
      <div className="flex flex-col items-center">
        <div className="w-12 sm:w-14 h-11 sm:h-12 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 dark:border-white/10 font-mono text-xl sm:text-2xl font-bold tracking-tight text-gold-300">
          {seconds}
        </div>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-white/70 mt-1">Detik</span>
      </div>
    </div>
  );
};
