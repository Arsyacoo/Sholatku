import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../app/globals.css';
import { MobileShell } from './MobileShell';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileShell />
  </StrictMode>
);
