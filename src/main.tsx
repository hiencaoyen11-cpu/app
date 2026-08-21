import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { StandaloneWalletApp } from './StandaloneWalletApp.tsx';
import { WalletProvider } from './context/WalletContext.tsx';
import './index.css';

// Check if building or running purely as standalone Android APK
const checkIsPureWallet = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Env variable
  if ((import.meta as any).env?.VITE_APP_MODE === 'wallet') return true;

  // 2. Capacitor / Native Android webview
  if (
    (window as any).Capacitor?.isNativePlatform?.() ||
    (window as any).Capacitor?.getPlatform?.() === 'android' ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:'
  ) {
    return true;
  }

  // 3. Android Standalone PWA / WebAPK / TWA
  if (window.matchMedia?.('(display-mode: standalone)')?.matches || (window.navigator as any).standalone) {
    return true;
  }

  // 4. Query Params (mode=wallet, mode=app, mode=mobile, view=app, view=wallet, clean=1)
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode')?.toLowerCase();
  const view = params.get('view')?.toLowerCase();
  if (
    mode === 'wallet' ||
    mode === 'app' ||
    mode === 'mobile' ||
    view === 'app' ||
    view === 'wallet' ||
    params.get('standalone') === 'true' ||
    params.get('clean') === 'true'
  ) {
    return true;
  }

  // 5. Pathname routes (/app, /wallet, /mobile)
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/app') || path.startsWith('/wallet') || path.startsWith('/mobile')) {
    return true;
  }

  return false;
};

const isPureWallet = checkIsPureWallet();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPureWallet ? (
      <WalletProvider>
        <StandaloneWalletApp />
      </WalletProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);

