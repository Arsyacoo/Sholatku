'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-surface-200 dark:bg-surface-800 rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
};
