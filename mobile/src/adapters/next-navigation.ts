import { useMobileLocation, useMobileRouter } from '../router';

export function usePathname(): string {
  return useMobileLocation().pathname;
}

export function useRouter() {
  const { navigate } = useMobileRouter();

  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => window.history.back(),
    refresh: () => window.location.reload(),
    prefetch: async () => undefined,
  };
}

export function useSearchParams(): URLSearchParams {
  const { search } = useMobileLocation();
  return new URLSearchParams(search);
}
