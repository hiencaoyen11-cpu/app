import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import { AndroidFrame } from './components/mobile/AndroidFrame';
import { BottomNav, TabType } from './components/mobile/BottomNav';
import { WalletDashboard } from './components/mobile/WalletDashboard';
import { ReceiveModal } from './components/mobile/ReceiveModal';
import { SendModal } from './components/mobile/SendModal';
import { SwapModal } from './components/mobile/SwapModal';
import { TransactionHistory } from './components/mobile/TransactionHistory';
import { TransactionDetailModal } from './components/mobile/TransactionDetailModal';
import { DAppBrowser } from './components/mobile/DAppBrowser';
import { SettingsTab } from './components/mobile/SettingsTab';
import { SecurityScreen } from './components/mobile/SecurityScreen';
import { OnboardingScreen } from './components/mobile/OnboardingScreen';
import { UserSelectorModal } from './components/mobile/UserSelectorModal';
import { CryptoAsset, Transaction } from './types';

export const StandaloneWalletApp: React.FC = () => {
  const { isLocked, isOnboarding } = useWallet();
  const [mobileTab, setMobileTab] = useState<TabType>('wallet');

  // Mobile modal states
  const [receiveModalAsset, setReceiveModalAsset] = useState<CryptoAsset | undefined>(undefined);
  const [showReceiveModal, setShowReceiveModal] = useState<boolean>(false);
  const [sendModalAsset, setSendModalAsset] = useState<CryptoAsset | undefined>(undefined);
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState<boolean>(false);
  const [showPinLockTest, setShowPinLockTest] = useState<boolean>(false);

  const handleOpenReceive = (asset?: CryptoAsset) => {
    setReceiveModalAsset(asset);
    setShowReceiveModal(true);
  };

  const handleOpenSend = (asset?: CryptoAsset) => {
    setSendModalAsset(asset);
    setShowSendModal(true);
  };

  return (
    <AndroidFrame standalone={true}>
      {isOnboarding ? (
        <OnboardingScreen />
      ) : isLocked ? (
        <SecurityScreen onUnlockSuccess={() => {}} />
      ) : (
        <div className="flex-1 relative flex flex-col h-full overflow-hidden bg-[#050811]">
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {mobileTab === 'wallet' && (
              <WalletDashboard
                onOpenReceive={handleOpenReceive}
                onOpenSend={handleOpenSend}
                onOpenSwap={() => setShowSwapModal(true)}
                onOpenHistory={() => setShowHistoryModal(true)}
                onOpenUserModal={() => setShowUserModal(true)}
              />
            )}

            {mobileTab === 'swap' && <SwapModal isTab={true} />}
            {mobileTab === 'browser' && <DAppBrowser />}
            {mobileTab === 'settings' && (
              <SettingsTab
                onOpenRecoveryPhrase={() => setShowRecoveryPhrase(true)}
                onOpenUserModal={() => setShowUserModal(true)}
                onOpenPinLockTest={() => setShowPinLockTest(true)}
              />
            )}
          </div>

          <BottomNav activeTab={mobileTab} onChangeTab={setMobileTab} />

          {showReceiveModal && (
            <ReceiveModal
              initialAsset={receiveModalAsset}
              onClose={() => setShowReceiveModal(false)}
            />
          )}

          {showSendModal && (
            <SendModal
              initialAsset={sendModalAsset}
              onClose={() => setShowSendModal(false)}
            />
          )}

          {showSwapModal && (
            <SwapModal onClose={() => setShowSwapModal(false)} />
          )}

          {showHistoryModal && (
            <div className="absolute inset-0 bg-[#070b14] z-40 flex flex-col animate-in fade-in">
              <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                >
                  ✕
                </button>
                <span className="font-bold text-sm tracking-wide">
                  Historial de Transacciones
                </span>
                <div className="w-9" />
              </div>
              <div className="flex-1 overflow-hidden">
                <TransactionHistory
                  onSelectTx={(tx) => setSelectedTxDetail(tx)}
                />
              </div>
            </div>
          )}

          {selectedTxDetail && (
            <TransactionDetailModal
              transaction={selectedTxDetail}
              onClose={() => setSelectedTxDetail(null)}
            />
          )}

          {showUserModal && (
            <UserSelectorModal onClose={() => setShowUserModal(false)} />
          )}

          {showRecoveryPhrase && (
            <SecurityScreen
              mode="phrase_view"
              onClose={() => setShowRecoveryPhrase(false)}
            />
          )}

          {showPinLockTest && (
            <SecurityScreen
              mode="lock"
              onUnlockSuccess={() => setShowPinLockTest(false)}
            />
          )}
        </div>
      )}
    </AndroidFrame>
  );
};
