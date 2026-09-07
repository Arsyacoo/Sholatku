function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed) return '/';
  if (trimmed === '/') return trimmed;
  return trimmed.replace(/\/+$/, '') || '/';
}

export function isRouteActive(pathname: string, href: string): boolean {
  const current = normalizePathname(pathname);
  const target = normalizePathname(href);

  if (target === '/') return current === '/';

  return current === target || current.startsWith(`${target}/`);
}
