import { registerPlugin } from '@capacitor/core';

import { isNativeRuntime } from './runtime';

interface SettingsPlugin {
  openAppSettings(): Promise<void>;
}

const settingsPlugin = registerPlugin<SettingsPlugin>('SholatkuSettings');

/** Android only: opens the system "App info" screen for Sholatku (battery, permissions, unused-app settings). */
export async function openAppSettings(): Promise<void> {
  if (!isNativeRuntime()) return;
  await settingsPlugin.openAppSettings();
}

const ONBOARDING_KEY = 'sholatku_android_onboarding_v1';

export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'done';
  } catch {
    return true;
  }
}

export function markOnboardingDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'done');
  } catch {
    // Without storage the guide may show again next launch, which is harmless.
  }
}
