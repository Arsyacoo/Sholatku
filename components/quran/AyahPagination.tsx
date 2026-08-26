'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface AyahPaginationProps {
  currentPage: number;
  totalPages: number;
  totalAyahs: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const AyahPagination: React.FC<AyahPaginationProps> = ({
  currentPage,
  totalPages,
  totalAyahs,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startAyah = (currentPage - 1) * pageSize + 1;
  const endAyah = Math.min(currentPage * pageSize, totalAyahs);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleSelect = (page: number) => {
    onPageChange(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xs">
      <div className="text-xs text-slate-500 font-medium">
        Menampilkan Ayat <span className="font-bold text-slate-800 dark:text-slate-200">{startAyah} - {endAyah}</span> dari {totalAyahs} (Hal. {currentPage}/{totalPages})
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          disabled={currentPage <= 1}
          onClick={() => handleSelect(currentPage - 1)}
          className="text-xs px-2.5 py-1.5"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-slate-400 text-xs">
                  ...
                </span>
              );
            }
            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => handleSelect(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          size="sm"
          variant="secondary"
          disabled={currentPage >= totalPages}
          onClick={() => handleSelect(currentPage + 1)}
          className="text-xs px-2.5 py-1.5"
          aria-label="Halaman berikutnya"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
