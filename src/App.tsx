import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import { TopHeader, ViewMode } from './components/TopHeader';
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
import { CrmHeader } from './components/crm/CrmHeader';
import { BalanceManager } from './components/crm/BalanceManager';
import { TransactionGenerator } from './components/crm/TransactionGenerator';
import { UserManagement } from './components/crm/UserManagement';
import { AuditLogViewer } from './components/crm/AuditLogViewer';
import { NewUserModal } from './components/crm/NewUserModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { CryptoAsset, Transaction } from './types';

const MainAppContent: React.FC = () => {
  const { isLocked, isOnboarding, unlockWithPin, lockWallet } = useWallet();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'mobile') return 'mobile';
      if (window.innerWidth < 768) return 'mobile';
    }
    return 'dual';
  });
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
  const [showApkModal, setShowApkModal] = useState<boolean>(false);

  // CRM tab state
  const [activeCrmTab, setActiveCrmTab] = useState<'balances' | 'generator' | 'users' | 'audit' | 'sessions'>('balances');
  const [showNewUserModal, setShowNewUserModal] = useState<boolean>(false);

  const handleOpenReceive = (asset?: CryptoAsset) => {
    setReceiveModalAsset(asset);
    setShowReceiveModal(true);
  };

  const handleOpenSend = (asset?: CryptoAsset) => {
    setSendModalAsset(asset);
    setShowSendModal(true);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Main Navigation Header */}
      <TopHeader
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onOpenApkModal={() => setShowApkModal(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ================= LEFT / CENTER: ANDROID PHONE SIMULATOR ================= */}
        {(viewMode === 'dual' || viewMode === 'mobile') && (
          <div
            className={`flex-1 flex items-center justify-center p-4 md:p-6 overflow-y-auto ${
              viewMode === 'dual'
                ? 'lg:max-w-[460px] xl:max-w-[500px] border-r border-slate-800/80 bg-[#070b14]/90'
                : 'w-full bg-[#050811]'
            }`}
          >
            <div className="w-full flex flex-col items-center">
              {/* Badge for Mobile Area */}
              <div className="mb-2 flex items-center justify-between w-full max-w-[390px] px-1 text-xs text-slate-400 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Android Trust Wallet (En Vivo)</span>
                </div>
                <button
                  onClick={() => setShowApkModal(true)}
                  className="text-[#00D4FF] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <span>Instalar APK / PWA</span>
                </button>
              </div>

              {/* Realistic Android Phone Device */}
              <AndroidFrame>
                {/* Onboarding Welcome & Import Flow if first time or requested */}
                {isOnboarding ? (
                  <OnboardingScreen />
                ) : isLocked ? (
                  /* Security Lock Screen if Wallet is Locked */
                  <SecurityScreen onUnlockSuccess={() => {}} />
                ) : (
                  <div className="flex-1 relative flex flex-col h-full overflow-hidden">
                    {/* Active Mobile Tab Content */}
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

                    {/* Bottom Nav Tabs */}
                    <BottomNav activeTab={mobileTab} onChangeTab={setMobileTab} />

                    {/* OVERLAY MODALS INSIDE PHONE */}
                    {/* Receive Modal */}
                    {showReceiveModal && (
                      <ReceiveModal
                        initialAsset={receiveModalAsset}
                        onClose={() => setShowReceiveModal(false)}
                      />
                    )}

                    {/* Send Modal */}
                    {showSendModal && (
                      <SendModal
                        initialAsset={sendModalAsset}
                        onClose={() => setShowSendModal(false)}
                      />
                    )}

                    {/* Swap Modal (when opened from Dashboard button) */}
                    {showSwapModal && (
                      <SwapModal onClose={() => setShowSwapModal(false)} />
                    )}

                    {/* Transaction History Screen */}
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

                    {/* Transaction Detail Modal */}
                    {selectedTxDetail && (
                      <TransactionDetailModal
                        transaction={selectedTxDetail}
                        onClose={() => setSelectedTxDetail(null)}
                      />
                    )}

                    {/* User / Wallet Selector Modal */}
                    {showUserModal && (
                      <UserSelectorModal onClose={() => setShowUserModal(false)} />
                    )}

                    {/* 12-Word Secret Recovery Phrase Modal */}
                    {showRecoveryPhrase && (
                      <SecurityScreen
                        mode="phrase_view"
                        onClose={() => setShowRecoveryPhrase(false)}
                      />
                    )}

                    {/* PIN Lock Test Screen */}
                    {showPinLockTest && (
                      <SecurityScreen
                        mode="lock"
                        onUnlockSuccess={() => setShowPinLockTest(false)}
                      />
                    )}
                  </div>
                )}
              </AndroidFrame>
            </div>
          </div>
        )}

        {/* ================= RIGHT: REMOTE CRM CONTROL PANEL ================= */}
        {(viewMode === 'dual' || viewMode === 'crm') && (
          <div className="flex-1 flex flex-col bg-[#080d19] overflow-hidden">
            {/* CRM Header with real-time indicators and sub-tabs */}
            <CrmHeader
              activeCrmTab={activeCrmTab}
              onChangeCrmTab={setActiveCrmTab}
              onOpenNewUserModal={() => setShowNewUserModal(true)}
              onOpenApkModal={() => setShowApkModal(true)}
            />

            {/* Active CRM Content */}
            <div className="flex-1 overflow-y-auto">
              {activeCrmTab === 'balances' && <BalanceManager />}
              {activeCrmTab === 'generator' && <TransactionGenerator />}
              {activeCrmTab === 'users' && (
                <UserManagement onOpenNewUserModal={() => setShowNewUserModal(true)} />
              )}
              {activeCrmTab === 'audit' && <AuditLogViewer />}
            </div>
          </div>
        )}
      </div>

      {/* Global New User Modal (from CRM or top header) */}
      {showNewUserModal && (
        <NewUserModal onClose={() => setShowNewUserModal(false)} />
      )}

      {/* Android APK & PWA Testing Modal */}
      {showApkModal && (
        <AndroidApkModal onClose={() => setShowApkModal(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <WalletProvider>
      <MainAppContent />
    </WalletProvider>
  );
}
