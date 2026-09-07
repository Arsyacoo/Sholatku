import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';

import { isNativeRuntime } from './runtime';

export interface NativeLifecycleEvent {
  canGoBack: boolean;
}

export interface NativeLifecycleHandlers {
  onResume?: () => void;
  onPause?: () => void;
  onBackButton?: (event: NativeLifecycleEvent) => void | boolean | Promise<void | boolean>;
}

function emitWebFocusPulse(): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event('focus'));
  document.dispatchEvent(new Event('visibilitychange'));
}

export async function installNativeLifecycle(
  handlers: NativeLifecycleHandlers
): Promise<() => Promise<void>> {
  if (!isNativeRuntime()) {
    return async () => undefined;
  }

  const listeners: PluginListenerHandle[] = [];

  listeners.push(
    await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        handlers.onResume?.();
        emitWebFocusPulse();
        return;
      }

      handlers.onPause?.();
    })
  );

  listeners.push(
    await App.addListener('backButton', async (event) => {
      await handlers.onBackButton?.({ canGoBack: event.canGoBack });
    })
  );

  return async () => {
    await Promise.all(listeners.map((listener) => listener.remove()));
  };
}
