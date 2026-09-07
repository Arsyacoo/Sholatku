import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface MobileLocationSnapshot {
  pathname: string;
  search: string;
  hash: string;
  href: string;
  key: string;
}

interface MobileRouterContextValue {
  location: MobileLocationSnapshot;
  navigate: (href: string, options?: { replace?: boolean }) => void;
}

const MobileRouterContext = createContext<MobileRouterContextValue | null>(null);

function readLocation(): MobileLocationSnapshot {
  const { pathname, search, hash, href } = window.location;
  return {
    pathname,
    search,
    hash,
    href,
    key: `${pathname}${search}${hash}`,
  };
}

function isExternalUrl(href: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(href.trim());
}

function installHistoryBridge(onChange: () => void): () => void {
  const { pushState, replaceState } = window.history;

  const handleLocationChange = () => onChange();
  const patchedPushState: History['pushState'] = function pushStateProxy(this: History, ...args) {
    const result = pushState.apply(this, args);
    window.dispatchEvent(new Event('sholatku:locationchange'));
    return result;
  };
  const patchedReplaceState: History['replaceState'] = function replaceStateProxy(this: History, ...args) {
    const result = replaceState.apply(this, args);
    window.dispatchEvent(new Event('sholatku:locationchange'));
    return result;
  };

  window.addEventListener('popstate', handleLocationChange);
  window.addEventListener('sholatku:locationchange', handleLocationChange);
  window.history.pushState = patchedPushState;
  window.history.replaceState = patchedReplaceState;

  return () => {
    window.removeEventListener('popstate', handleLocationChange);
    window.removeEventListener('sholatku:locationchange', handleLocationChange);
    window.history.pushState = pushState;
    window.history.replaceState = replaceState;
  };
}

export function MobileRouterProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<MobileLocationSnapshot>(() => readLocation());

  useEffect(() => {
    const syncLocation = () => {
      setLocation(readLocation());
    };

    const cleanup = installHistoryBridge(syncLocation);
    syncLocation();
    return cleanup;
  }, []);

  const navigate = useCallback((href: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    if (isExternalUrl(href)) {
      window.location.assign(href);
      return;
    }

    const url = new URL(href, window.location.href);
    const next = `${url.pathname}${url.search}${url.hash}`;

    if (options?.replace) {
      window.history.replaceState(window.history.state, '', next);
    } else {
      window.history.pushState(window.history.state, '', next);
    }
  }, []);

  const value = useMemo<MobileRouterContextValue>(
    () => ({
      location,
      navigate,
    }),
    [location, navigate]
  );

  return <MobileRouterContext.Provider value={value}>{children}</MobileRouterContext.Provider>;
}

export function useMobileRouter(): MobileRouterContextValue {
  const value = useContext(MobileRouterContext);
  if (!value) {
    throw new Error('useMobileRouter harus digunakan di dalam MobileRouterProvider.');
  }

  return value;
}

export function useMobileLocation(): MobileLocationSnapshot {
  return useMobileRouter().location;
}

export function useMobilePathname(): string {
  return useMobileLocation().pathname;
}
