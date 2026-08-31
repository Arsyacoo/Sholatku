export function parseAyahQuery(value: string | null, totalAyahs: number): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const ayahNumber = Number(value);
  return Number.isInteger(ayahNumber) && ayahNumber >= 1 && ayahNumber <= totalAyahs
    ? ayahNumber
    : null;
}

export function getAyahPage(ayahNumbers: number[], ayahNumber: number, pageSize: number): number | null {
  const index = ayahNumbers.findIndex((number) => number === ayahNumber);
  if (index < 0 || pageSize < 1) return null;
  return Math.floor(index / pageSize) + 1;
}
