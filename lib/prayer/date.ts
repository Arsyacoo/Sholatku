/**
 * Canonical date used by the prayer domain: YYYY-MM-DD.
 * Provider responses are normally DD-MM-YYYY and must be parsed explicitly.
 */
export function parseProviderGregorianDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!input) return null;

  const providerMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(input);
  const canonicalMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!providerMatch && !canonicalMatch) return null;

  const year = Number((providerMatch ?? canonicalMatch)![providerMatch ? 3 : 1]);
  const month = Number((providerMatch ?? canonicalMatch)![providerMatch ? 2 : 2]);
  const day = Number((providerMatch ?? canonicalMatch)![providerMatch ? 1 : 3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addDaysToCanonicalDate(date: string, amount: number): string {
  const canonical = parseProviderGregorianDate(date);
  if (!canonical) throw new Error(`Invalid canonical prayer date: ${date}`);
  const [year, month, day] = canonical.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + amount));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(
    result.getUTCDate()
  ).padStart(2, '0')}`;
}

export function canonicalDateToUtcDate(date: string): Date {
  const canonical = parseProviderGregorianDate(date);
  if (!canonical) throw new Error(`Invalid canonical prayer date: ${date}`);
  const [year, month, day] = canonical.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}
