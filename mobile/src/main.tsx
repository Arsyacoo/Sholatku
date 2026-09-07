import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../app/globals.css';
import { MobileShell } from './MobileShell';

const MOBILE_BODY_CLASS =
  'min-h-screen flex flex-col font-sans bg-surface-50 dark:bg-surface-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-primary-500 selection:text-white';

function bootstrapMobileDocument(): void {
  if (typeof document === 'undefined') return;

  document.body.className = MOBILE_BODY_CLASS;

  try {
    const savedTheme = window.localStorage.getItem('sholatku_theme_mode');
    const isDark =
      savedTheme === 'dark' ||
      (savedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch {
    // Theme preference is best-effort during mobile boot.
  }
}

bootstrapMobileDocument();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileShell />
  </StrictMode>
);
