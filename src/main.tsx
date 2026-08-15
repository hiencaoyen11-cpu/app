import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { StandaloneWalletApp } from './StandaloneWalletApp.tsx';
import { WalletProvider } from './context/WalletContext.tsx';
import './index.css';

// Check if building or running purely as standalone Android APK
const isPureWallet = 
  (import.meta as any).env?.VITE_APP_MODE === 'wallet' ||
  (typeof window !== 'undefined' && (
    (window as any).Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    new URLSearchParams(window.location.search).get('mode') === 'wallet'
  ));

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

