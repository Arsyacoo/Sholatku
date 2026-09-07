import { useEffect } from 'react';
import { App } from '@capacitor/app';

import { dispatchBackAction } from '@/lib/platform/back';
import { installNativeLifecycle } from '@/lib/platform/lifecycle';
import { getAppRuntime } from '@/lib/platform/runtime';

import { MobileRouterProvider } from './router';
import { MobileRoutes } from './MobileRoutes';

function useNativeShellLifecycle(): void {
  useEffect(() => {
    let cancelled = false;
    let cleanup: () => Promise<void> = async () => undefined;

    if (getAppRuntime() !== 'android') return;

    void installNativeLifecycle({
      onResume: () => undefined,
      onBackButton: async ({ canGoBack }) => {
        const handled = await dispatchBackAction();
        if (handled) return true;

        if (window.history.length > 1 && canGoBack) {
          window.history.back();
          return true;
        }

        if (window.history.length > 1) {
          window.history.back();
          return true;
        }

        await App.exitApp();
        return true;
      },
    }).then((teardown) => {
      if (cancelled) {
        void teardown();
        return;
      }

      cleanup = teardown;
    });

    return () => {
      cancelled = true;
      void cleanup();
    };
  }, []);
}

export function MobileShell() {
  useNativeShellLifecycle();

  return (
    <MobileRouterProvider>
      <div className="min-h-screen flex flex-col">
        <MobileRoutes />
      </div>
    </MobileRouterProvider>
  );
}
