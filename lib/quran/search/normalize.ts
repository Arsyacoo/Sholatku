/** Normalizes Latin/Indonesian text for deterministic, case-insensitive search. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[-–—]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Removes common Arabic marks for comparison while preserving display text. */
export function normalizeArabicText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\u0640/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
