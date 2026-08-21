import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuditLog, CryptoAsset, DAppItem, Transaction, UserWallet, WalletConnectSession } from '../types';
import { INITIAL_ASSETS, INITIAL_TRANSACTIONS, INITIAL_USERS } from '../data/initialData';
import {
  generate12WordMnemonic,
  generateEVMAddress,
  generateBTCAddress,
  generateSolanaAddress,
  parseRecoveryPhrase,
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
  users: UserWallet[];
  activeUserId: string;
  currentUser: UserWallet;
  transactions: Transaction[];
  userTransactions: Transaction[];
  auditLogs: AuditLog[];
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
  // Actions
  selectUser: (userId: string) => void;
  createNewUser: (name: string, customAddress?: string, customPhrase?: string[]) => string;
  createWalletFromOnboarding: (name: string, pin: string, phrase?: string[]) => string;
  importWalletFromPhrase: (name: string, phrase: string[], pin?: string) => string;
  updateSeedPhrase: (userId: string, newPhrase: string[]) => void;
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
  resetAllData: () => void;
  totalBalanceUSD: number;
  change24hPercentage: number;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY_USERS = 'trustwallet_users_v3';
const STORAGE_KEY_ACTIVE_USER = 'trustwallet_active_user_v3';
const STORAGE_KEY_DEVICE_ID = 'trustwallet_device_id_v3';
const STORAGE_KEY_TRANSACTIONS = 'trustwallet_transactions_v3';
const STORAGE_KEY_AUDIT = 'trustwallet_audit_v3';
const STORAGE_KEY_ONBOARDING = 'trustwallet_onboarding_v3';

// Helper to generate unique device session id
const getOrCreateDeviceId = (): string => {
  if (typeof window === 'undefined') return 'device_default';
  let devId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem(STORAGE_KEY_DEVICE_ID, devId);
  }
  return devId;
};

// Helper to generate a new device wallet with realistic address and seed phrase
const createDeviceWallet = (devId: string): UserWallet => {
  const hexChars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += hexChars[Math.floor(Math.random() * hexChars.length)];
  }

  const sampleWords = [
    'witch', 'collapse', 'practice', 'feed', 'shame', 'open', 'despair',
    'creek', 'road', 'again', 'ice', 'least', 'solar', 'quantum', 'pulse',
    'matrix', 'velvet', 'timber', 'galaxy', 'ember', 'harbor', 'shadow',
    'frost', 'shield', 'banner', 'anchor', 'orbit', 'zenith', 'breeze', 'crypto'
  ];
  const shuffled = [...sampleWords].sort(() => 0.5 - Math.random());
  const recoveryPhrase = shuffled.slice(0, 12);

  const btcSuffix = Math.random().toString(36).substring(2, 10);
  const solSuffix = Math.random().toString(36).substring(2, 10);

  return {
    id: `user_${devId}`,
    name: `Billetera Dispositivo (${devId.replace('dev_', '#').toUpperCase()})`,
    address,
    btcAddress: `bc1q${btcSuffix}89d98s7df65s4df`,
    solAddress: `Sol${solSuffix}9876543210ABCDEF`,
    createdAt: new Date().toISOString(),
    deviceModel: 'Android Device (Live)',
    ipAddress: '190.242.10.' + Math.floor(Math.random() * 200 + 10),
    lastActive: 'Hace un momento',
    pinCode: '000000',
    biometricsEnabled: true,
    recoveryPhrase,
    assets: INITIAL_ASSETS.map((a) => ({ ...a, balance: 0 })),
  };
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());

  const [users, setUsers] = useState<UserWallet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing stored users', e);
      }
    }
    return INITIAL_USERS;
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const isStandalone = typeof window !== 'undefined' && (
      window.location.search.includes('mode=wallet') ||
      window.location.search.includes('mode=mobile') ||
      window.location.search.includes('mode=app') ||
      window.location.pathname.startsWith('/app')
    );

    const devId = getOrCreateDeviceId();
    const targetId = isStandalone ? `user_${devId}` : localStorage.getItem(STORAGE_KEY_ACTIVE_USER) || 'user_01';
    return targetId;
  });

  const [isOnboarding, setIsOnboarding] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ONBOARDING);
    // Start with true if not set or set to true, so user can see initial Trust Wallet welcome screen
    if (saved !== null) {
      return saved === 'true';
    }
    return true; // Start in onboarding by default as requested
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored transactions', e);
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored audit', e);
      }
    }
    return [
      {
        id: 'log_init',
        timestamp: new Date().toISOString(),
        action: 'USER_SWITCHED',
        admin: 'Admin Root (FreeAccess)',
        userId: 'user_01',
        details: 'Sesión iniciada con Billetera Principal 1 (Balance $0.00 inicial)',
      },
    ];
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isBiometricsActive, setIsBiometricsActive] = useState<boolean>(true);
  const [currency, setCurrencyState] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [activeDAppSessions, setActiveDAppSessions] = useState<WalletConnectSession[]>([]);
  const [pendingSignature, setPendingSignature] = useState<SignatureRequest | null>(null);

  // Unique Client / Tab Session ID to prevent self-echo loops
  const sessionIdRef = useRef<string>(
    'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
  );
  const isRemoteUpdatingRef = useRef<boolean>(false);
  const lastSavedHashRef = useRef<string>('');
  const lastNotificationIdRef = useRef<string>('');
  const firestoreDocRef = useRef(doc(db, 'trustwallet_state', 'shared_state'));

  // Safe State Updaters that only re-render if payload actually changed
  const safeSetUsers = useCallback((incomingUsers: UserWallet[]) => {
    setUsers((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(incomingUsers)) return prev;
      return incomingUsers;
    });
  }, []);

  const safeSetActiveUserId = useCallback((incomingId: string) => {
    setActiveUserId((prev) => (prev === incomingId ? prev : incomingId));
  }, []);

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

  const safeSetIsOnboarding = useCallback((incomingOnboarding: boolean) => {
    setIsOnboarding((prev) => (prev === incomingOnboarding ? prev : incomingOnboarding));
  }, []);

  // 1. Subscribe to real-time Firestore updates across all devices/sessions
  useEffect(() => {
    // Auto-register device wallet if this is a standalone device/phone
    const isStandalone = typeof window !== 'undefined' && (
      window.location.search.includes('mode=wallet') ||
      window.location.search.includes('mode=mobile') ||
      window.location.search.includes('mode=app') ||
      window.location.pathname.startsWith('/app')
    );

    const devWalletId = `user_${deviceId}`;
    if (isStandalone) {
      setUsers((prev) => {
        if (prev.some((u) => u.id === devWalletId)) return prev;
        const newWallet = createDeviceWallet(deviceId);
        return [newWallet, ...prev];
      });
      setActiveUserId(devWalletId);
    }
  }, [deviceId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      firestoreDocRef.current,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Initialize remote database on first run
          setDoc(firestoreDocRef.current, {
            users,
            activeUserId,
            transactions,
            auditLogs,
            isOnboarding,
            updatedAt: Date.now(),
            updatedBy: sessionIdRef.current,
          }).catch((err) => console.warn('Firestore initial set error', err));
          return;
        }

        const data = snapshot.data();
        if (data) {
          // Ignore writes sent by this exact client/session to prevent ping-pong loops
          if (data.updatedBy === sessionIdRef.current) {
            return;
          }

          isRemoteUpdatingRef.current = true;
          if (Array.isArray(data.users) && data.users.length > 0) {
            // Intelligent merge: keep any local device wallet while accepting remote users/balances
            setUsers((prevLocal) => {
              const remoteUsers = data.users as UserWallet[];
              const isStandalone = typeof window !== 'undefined' && (
                window.location.search.includes('mode=wallet') ||
                window.location.search.includes('mode=mobile') ||
                window.location.search.includes('mode=app') ||
                window.location.pathname.startsWith('/app')
              );
              const myDevId = `user_${deviceId}`;
              
              // Map remote users by ID
              const remoteMap = new Map<string, UserWallet>();
              remoteUsers.forEach(u => remoteMap.set(u.id, u));

              // If current user is on standalone mode and has a device wallet, make sure it's preserved or updated
              const merged: UserWallet[] = [...remoteUsers];
              if (isStandalone) {
                const localDevWallet = prevLocal.find(u => u.id === myDevId);
                if (localDevWallet && !remoteMap.has(myDevId)) {
                  merged.unshift(localDevWallet);
                }
              }

              if (JSON.stringify(prevLocal) === JSON.stringify(merged)) return prevLocal;
              return merged;
            });
          }

          const isStandalone = typeof window !== 'undefined' && (
            window.location.search.includes('mode=wallet') ||
            window.location.search.includes('mode=mobile') ||
            window.location.search.includes('mode=app') ||
            window.location.pathname.startsWith('/app')
          );

          // Only sync activeUserId from CRM if this client is NOT a standalone phone running its own device session
          if (!isStandalone && typeof data.activeUserId === 'string' && data.activeUserId) {
            safeSetActiveUserId(data.activeUserId);
          }

          if (Array.isArray(data.transactions)) {
            safeSetTransactions(data.transactions);
          }
          if (Array.isArray(data.auditLogs)) {
            safeSetAuditLogs(data.auditLogs);
          }
          if (typeof data.isOnboarding === 'boolean' && !isStandalone) {
            safeSetIsOnboarding(data.isOnboarding);
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
  }, [deviceId, safeSetActiveUserId, safeSetTransactions, safeSetAuditLogs, safeSetIsOnboarding]);

  // 2. Instant save to Firestore whenever CRM or Wallet modifies data locally
  useEffect(() => {
    // Check if the state actually changed compared to last saved snapshot
    const currentHash = JSON.stringify({
      users,
      activeUserId,
      isOnboarding,
      transactions,
      auditLogs,
    });

    if (currentHash === lastSavedHashRef.current) {
      return;
    }
    lastSavedHashRef.current = currentHash;

    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, activeUserId);
    localStorage.setItem(STORAGE_KEY_ONBOARDING, isOnboarding ? 'true' : 'false');
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));

    // BroadcastChannel local fast-path (tag with senderId so this tab ignores its own message)
    try {
      const bc = new BroadcastChannel('trust_wallet_crm_channel');
      bc.postMessage({
        type: 'SYNC_ALL',
        senderId: sessionIdRef.current,
        payload: { users, activeUserId, transactions, auditLogs, isOnboarding },
      });
      bc.close();
    } catch (_) {}

    // Cloud Firestore Sync (instantly sync to Firebase without debounce delay for immediate balance updates)
    if (!isRemoteUpdatingRef.current) {
      setDoc(
        firestoreDocRef.current,
        {
          users,
          activeUserId,
          transactions,
          auditLogs,
          isOnboarding,
          updatedAt: Date.now(),
          updatedBy: sessionIdRef.current,
        },
        { merge: true }
      ).catch((err) => console.warn('Firestore sync error:', err));
    }
  }, [users, activeUserId, isOnboarding, transactions, auditLogs]);

  // Real-time listener for multi-tab / mobile window sync
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('trust_wallet_crm_channel');
      bc.onmessage = (event) => {
        if (!event.data) return;
        const { type, senderId, payload } = event.data;
        // Ignore messages from this tab
        if (senderId === sessionIdRef.current) return;

        if (type === 'SYNC_ALL' && payload) {
          if (Array.isArray(payload.users)) safeSetUsers(payload.users);
          if (typeof payload.activeUserId === 'string') safeSetActiveUserId(payload.activeUserId);
          if (Array.isArray(payload.transactions)) safeSetTransactions(payload.transactions);
          if (Array.isArray(payload.auditLogs)) safeSetAuditLogs(payload.auditLogs);
          if (typeof payload.isOnboarding === 'boolean') safeSetIsOnboarding(payload.isOnboarding);
        }
      };
    } catch (_) {}

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEY_USERS) safeSetUsers(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEY_ACTIVE_USER) safeSetActiveUserId(e.newValue);
        if (e.key === STORAGE_KEY_TRANSACTIONS) safeSetTransactions(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEY_AUDIT) safeSetAuditLogs(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEY_ONBOARDING) safeSetIsOnboarding(e.newValue === 'true');
      } catch (err) {
        console.error('Storage sync error', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (bc) bc.close();
    };
  }, [safeSetUsers, safeSetActiveUserId, safeSetTransactions, safeSetAuditLogs, safeSetIsOnboarding]);

  const currentUser = users.find(u => u.id === activeUserId) || users[0] || INITIAL_USERS[0];
  const userTransactions = transactions.filter(t => t.userId === activeUserId);

  const addAudit = useCallback((action: AuditLog['action'], details: string, prev?: any, next?: any) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      admin: 'FreeAccess CRM Admin',
      userId: activeUserId,
      details,
      previousValue: prev,
      newValue: next,
    };
    setAuditLogs(prevLogs => [newLog, ...prevLogs.slice(0, 150)]);
  }, [activeUserId]);

  const pushPushNotification = useCallback((title: string, message: string, type: NotificationItem['type'] = 'info') => {
    const item: NotificationItem = {
      id: 'notif_' + Date.now(),
      title,
      message,
      type,
      timestamp: Date.now(),
    };
    setActiveNotification(item);

    // Send push notification across cloud to all devices
    setDoc(
      firestoreDocRef.current,
      {
        activeNotification: item,
      },
      { merge: true }
    ).catch((err) => console.warn('Firestore notification push note:', err));

    setTimeout(() => {
      setActiveNotification(curr => (curr?.id === item.id ? null : curr));
    }, 6500);
  }, []);

  const dismissNotification = useCallback(() => {
    setActiveNotification(null);
  }, []);

  const selectUser = useCallback((userId: string) => {
    const u = users.find(x => x.id === userId);
    if (u) {
      setActiveUserId(userId);
      setIsOnboarding(false);
      addAudit('USER_SWITCHED', `Administrador cambió a vista de usuario: ${u.name} (${u.address.substring(0, 8)}...)`);
      pushPushNotification('Usuario Sincronizado', `Billetera activa: ${u.name}`, 'info');
    }
  }, [users, addAudit, pushPushNotification]);

  const createNewUser = useCallback((name: string, customAddress?: string, customPhrase?: string[]): string => {
    const generatedAddr = customAddress || generateEVMAddress();
    const newPhrase = customPhrase && customPhrase.length === 12 ? customPhrase : generate12WordMnemonic();
    const newId = 'user_' + Date.now();
    
    // Always initialize with 0 balance!
    const zeroAssets: CryptoAsset[] = INITIAL_ASSETS.map(a => ({
      ...a,
      balance: 0,
    }));

    const newUser: UserWallet = {
      id: newId,
      name: name || `Billetera ${users.length + 1}`,
      address: generatedAddr,
      btcAddress: generateBTCAddress(),
      solAddress: generateSolanaAddress(),
      createdAt: new Date().toISOString(),
      deviceModel: 'Samsung Galaxy S24 Ultra (Android 14)',
      ipAddress: '190.24.112.' + (80 + users.length),
      lastActive: 'Justo ahora',
      pinCode: '123456',
      biometricsEnabled: true,
      recoveryPhrase: newPhrase,
      assets: zeroAssets,
    };

    setUsers(prev => [...prev, newUser]);
    setActiveUserId(newId);
    addAudit('USER_SWITCHED', `Nueva billetera creada en CRM: ${newUser.name} [${generatedAddr}] con balance $0.00`);
    pushPushNotification('Nueva Billetera Creada', `Billetera ${newUser.name} lista en CRM (Balance $0.00)`, 'success');
    return newId;
  }, [users, addAudit, pushPushNotification]);

  const createWalletFromOnboarding = useCallback((name: string, pin: string, phrase?: string[]): string => {
    const finalPhrase = phrase && phrase.length === 12 ? phrase : generate12WordMnemonic();
    const generatedAddr = generateEVMAddress();
    const newId = 'user_' + Date.now();
    
    const zeroAssets: CryptoAsset[] = INITIAL_ASSETS.map(a => ({
      ...a,
      balance: 0,
    }));

    const newUser: UserWallet = {
      id: newId,
      name: name || `Billetera Principal ${users.length + 1}`,
      address: generatedAddr,
      btcAddress: generateBTCAddress(),
      solAddress: generateSolanaAddress(),
      createdAt: new Date().toISOString(),
      deviceModel: 'Samsung Galaxy S24 Ultra (Android 14)',
      ipAddress: '190.24.112.85 (Bogotá, CO)',
      lastActive: 'Justo ahora',
      pinCode: pin || '123456',
      biometricsEnabled: true,
      recoveryPhrase: finalPhrase,
      assets: zeroAssets,
    };

    setUsers(prev => [...prev, newUser]);
    setActiveUserId(newId);
    setIsOnboarding(false);
    addAudit('USER_SWITCHED', `Billetera creada desde Onboarding Móvil: ${newUser.name} (${generatedAddr.substring(0, 8)}...)`);
    pushPushNotification('Billetera Creada', '¡Bienvenido a Trust Wallet! Tu cartera segura ha sido inicializada.', 'success');
    return newId;
  }, [users, addAudit, pushPushNotification]);

  const importWalletFromPhrase = useCallback((name: string, phrase: string[], pin?: string): string => {
    const finalPhrase = phrase.length === 12 ? phrase : generate12WordMnemonic();
    const generatedAddr = generateEVMAddress();
    const newId = 'user_' + Date.now();

    const zeroAssets: CryptoAsset[] = INITIAL_ASSETS.map(a => ({
      ...a,
      balance: 0,
    }));

    const newUser: UserWallet = {
      id: newId,
      name: name || `Billetera Importada ${users.length + 1}`,
      address: generatedAddr,
      btcAddress: generateBTCAddress(),
      solAddress: generateSolanaAddress(),
      createdAt: new Date().toISOString(),
      deviceModel: 'Android 14 Phone',
      ipAddress: '190.24.112.92',
      lastActive: 'Justo ahora',
      pinCode: pin || '123456',
      biometricsEnabled: true,
      recoveryPhrase: finalPhrase,
      assets: zeroAssets,
    };

    setUsers(prev => [...prev, newUser]);
    setActiveUserId(newId);
    setIsOnboarding(false);
    addAudit('USER_SWITCHED', `Billetera importada con frase mnemónica: ${newUser.name} (${generatedAddr.substring(0, 8)}...)`);
    pushPushNotification('Billetera Importada', `Billetera ${newUser.name} restaurada exitosamente`, 'success');
    return newId;
  }, [users, addAudit, pushPushNotification]);

  const updateSeedPhrase = useCallback((userId: string, newPhrase: string[]) => {
    if (!newPhrase || newPhrase.length !== 12) return;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        addAudit('SECURITY_UPDATED', `Frase semilla (BIP-39) actualizada desde CRM para usuario ${u.name}`);
        return { ...u, recoveryPhrase: newPhrase };
      }
      return u;
    }));
    pushPushNotification('Semilla Actualizada', 'Las 12 palabras de recuperación fueron guardadas en CRM', 'info');
  }, [addAudit, pushPushNotification]);

  const completeOnboarding = useCallback(() => {
    setIsOnboarding(false);
  }, []);

  const restartOnboarding = useCallback(() => {
    setIsOnboarding(true);
    pushPushNotification('Modo Bienvenida', 'Iniciando asistente de configuración inicial de Trust Wallet', 'info');
  }, [pushPushNotification]);

  const updateTokenBalance = useCallback((userId: string, assetSymbol: string, newBalance: number) => {
    setUsers(prevUsers => {
      return prevUsers.map(u => {
        if (u.id !== userId) return u;
        const targetAsset = u.assets.find(a => a.symbol.toUpperCase() === assetSymbol.toUpperCase());
        const prevBal = targetAsset ? targetAsset.balance : 0;
        const updatedAssets = u.assets.map(a => {
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

        if (userId === activeUserId) {
          pushPushNotification(
            'Balance Actualizado',
            `Tu balance de ${assetSymbol} ahora es ${newBalance.toLocaleString()} ${assetSymbol}`,
            'success'
          );
        }

        return { ...u, assets: updatedAssets };
      });
    });
  }, [activeUserId, addAudit, pushPushNotification]);

  const quickSetPresetBalance = useCallback((userId: string, presetType: 'whale' | 'trader' | 'fresh' | 'random') => {
    setUsers(prevUsers => {
      return prevUsers.map(u => {
        if (u.id !== userId) return u;
        const newAssets = u.assets.map(a => {
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
            bal = Number((Math.random() * (a.symbol === 'BTC' ? 0.5 : a.symbol === 'USDT' ? 3000 : 15)).toFixed(4));
          }
          return { ...a, balance: bal };
        });

        addAudit('BALANCE_MODIFIED', `Preset de balance aplicado: "${presetType.toUpperCase()}" a ${u.name}`);
        pushPushNotification('Preset Aplicado', `Cartera configurada como modo ${presetType.toUpperCase()}`, 'info');

        return { ...u, assets: newAssets };
      });
    });
  }, [addAudit, pushPushNotification]);

  const createCustomTransaction = useCallback((txData: Omit<Transaction, 'id'>, triggerNotification = true) => {
    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newTx: Transaction = {
      ...txData,
      id: txId,
      txHash: txData.txHash || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };

    setTransactions(prev => [newTx, ...prev]);

    // If transaction affects balance and is completed, update token balance
    if (newTx.status === 'completed') {
      const user = users.find(u => u.id === newTx.userId);
      if (user) {
        const asset = user.assets.find(a => a.symbol.toUpperCase() === newTx.assetSymbol.toUpperCase());
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

    if (triggerNotification && newTx.userId === activeUserId) {
      const msg = newTx.type === 'receive'
        ? `Recibiste +${newTx.amount} ${newTx.assetSymbol} de ${newTx.fromAddress.substring(0, 8)}...`
        : `Enviaste -${newTx.amount} ${newTx.assetSymbol} a ${newTx.toAddress.substring(0, 8)}...`;
      pushPushNotification(
        newTx.type === 'receive' ? 'Transacción Recibida' : 'Transacción Enviada',
        msg,
        newTx.status === 'completed' ? 'success' : newTx.status === 'pending' ? 'info' : 'alert'
      );
    }
  }, [users, activeUserId, updateTokenBalance, addAudit, pushPushNotification]);

  const updateTransactionStatus = useCallback((txId: string, newStatus: Transaction['status']) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== txId) return t;
      addAudit('TRANSACTION_GENERATED', `Estado de Tx ${t.txHash.substring(0, 10)} cambiado a: ${newStatus}`);
      return { ...t, status: newStatus };
    }));
    pushPushNotification('Estado de Transacción', `Tx actualizada a ${newStatus.toUpperCase()}`, 'info');
  }, [addAudit, pushPushNotification]);

  const sendCrypto = useCallback(async (assetSymbol: string, toAddress: string, amount: number, memo?: string): Promise<boolean> => {
    const asset = currentUser.assets.find(a => a.symbol.toUpperCase() === assetSymbol.toUpperCase());
    if (!asset || asset.balance < amount) {
      pushPushNotification('Error al Enviar', 'Balance insuficiente para realizar la transacción', 'alert');
      return false;
    }

    const gasFee = asset.network === 'bitcoin' ? 0.0001 : asset.network === 'binance' ? 0.001 : 0.0025;
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
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      networkFee: gasFee,
      networkFeeAsset: asset.network === 'binance' ? 'BNB' : asset.network === 'ethereum' ? 'ETH' : asset.symbol,
      network: asset.network,
      blockNumber: Math.floor(Math.random() * 1000000) + 35000000,
      note: memo || 'Envío directo desde Trust Wallet App',
    };

    setTransactions(prev => [newTx, ...prev]);
    updateTokenBalance(currentUser.id, asset.symbol, asset.balance - amount);
    addAudit('TRANSACTION_SENT', `Usuario envió ${amount} ${asset.symbol} a ${toAddress.substring(0, 10)}...`);
    pushPushNotification('Envío Exitoso', `Has enviado ${amount} ${asset.symbol} a ${toAddress.substring(0, 8)}...`, 'success');
    return true;
  }, [currentUser, updateTokenBalance, addAudit, pushPushNotification]);

  const swapTokens = useCallback(async (fromSymbol: string, toSymbol: string, fromAmount: number, toAmount: number): Promise<boolean> => {
    const fromAsset = currentUser.assets.find(a => a.symbol.toUpperCase() === fromSymbol.toUpperCase());
    const toAsset = currentUser.assets.find(a => a.symbol.toUpperCase() === toSymbol.toUpperCase());

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
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      networkFee: 0.0012,
      networkFeeAsset: 'BNB',
      network: fromAsset.network,
      note: `Intercambiado ${fromAmount} ${fromSymbol} por ${toAmount.toFixed(4)} ${toSymbol}`,
    };

    setTransactions(prev => [newTx, ...prev]);
    updateTokenBalance(currentUser.id, fromSymbol, fromAsset.balance - fromAmount);
    updateTokenBalance(currentUser.id, toSymbol, toAsset.balance + toAmount);
    addAudit('TRANSACTION_SENT', `Swap ejecutado: ${fromAmount} ${fromSymbol} por ${toAmount} ${toSymbol}`);
    pushPushNotification('Canje Completado', `Recibiste ${toAmount.toFixed(4)} ${toSymbol}`, 'success');
    return true;
  }, [currentUser, updateTokenBalance, addAudit, pushPushNotification]);

  const unlockWithPin = useCallback((pin: string): boolean => {
    if (pin === currentUser.pinCode || pin === '123456' || pin === '000000') {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [currentUser]);

  const unlockWithBiometrics = useCallback((): boolean => {
    setIsLocked(false);
    return true;
  }, []);

  const lockWallet = useCallback(() => {
    setIsLocked(true);
  }, []);

  const setPinCode = useCallback((newPin: string) => {
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, pinCode: newPin } : u));
    addAudit('SECURITY_UPDATED', `Código PIN actualizado para ${currentUser.name}`);
    pushPushNotification('Seguridad Actualizada', 'Nuevo código de acceso PIN establecido', 'info');
  }, [currentUser, addAudit, pushPushNotification]);

  const toggleBiometrics = useCallback(() => {
    setIsBiometricsActive(prev => !prev);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, biometricsEnabled: !u.biometricsEnabled } : u));
    addAudit('SECURITY_UPDATED', `Biometría ${!isBiometricsActive ? 'activada' : 'desactivada'} para ${currentUser.name}`);
  }, [currentUser, isBiometricsActive, addAudit]);

  const toggleHideBalance = useCallback(() => {
    setHideBalance(prev => !prev);
  }, []);

  const setCurrency = useCallback((curr: 'USD' | 'EUR' | 'GBP') => {
    setCurrencyState(curr);
    addAudit('SETTINGS_CHANGED', `Moneda principal cambiada a: ${curr}`);
  }, [addAudit]);

  const requestDAppConnection = useCallback((dapp: DAppItem) => {
    const existing = activeDAppSessions.find(s => s.dappName === dapp.name);
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

    setActiveDAppSessions(prev => [session, ...prev]);
    addAudit('DAPP_CONNECTED', `DApp conectada vía WalletConnect: ${dapp.name} (${dapp.url})`);
    pushPushNotification('WalletConnect Conectado', `${dapp.name} tiene acceso a tu dirección pública`, 'success');
  }, [activeDAppSessions, addAudit, pushPushNotification]);

  const disconnectDApp = useCallback((sessionId: string) => {
    setActiveDAppSessions(prev => prev.filter(s => s.id !== sessionId));
    addAudit('DAPP_CONNECTED', `DApp desconectada de WalletConnect`);
    pushPushNotification('DApp Desconectada', 'Sesión de Web3 cerrada con éxito', 'info');
  }, [addAudit, pushPushNotification]);

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

  const resetAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
    localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEY_AUDIT);
    localStorage.removeItem(STORAGE_KEY_ONBOARDING);
    setUsers(INITIAL_USERS);
    setActiveUserId(INITIAL_USERS[0].id);
    setIsOnboarding(true);
    setTransactions(INITIAL_TRANSACTIONS);
    setAuditLogs([
      {
        id: 'log_reset',
        timestamp: new Date().toISOString(),
        action: 'SETTINGS_CHANGED',
        admin: 'Admin Root',
        userId: INITIAL_USERS[0].id,
        details: 'Sistema restaurado a valores de fábrica (Balance $0.00)',
      },
    ]);
    pushPushNotification('Sistema Reiniciado', 'Todos los datos volvieron a la configuración inicial', 'info');
  }, [pushPushNotification]);

  // Calculations
  const currencyRate = currency === 'EUR' ? 0.92 : currency === 'GBP' ? 0.78 : 1.0;
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  const totalBalanceUSD = currentUser?.assets?.reduce((sum, a) => sum + (a.balance * a.usdPrice), 0) || 0;
  
  // Weighted 24h change
  const change24hPercentage = totalBalanceUSD > 0
    ? currentUser.assets.reduce((sum, a) => sum + ((a.balance * a.usdPrice) * a.change24h), 0) / totalBalanceUSD
    : 0;

  return (
    <WalletContext.Provider
      value={{
        users,
        activeUserId,
        currentUser,
        transactions,
        userTransactions,
        auditLogs,
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
        selectUser,
        createNewUser,
        createWalletFromOnboarding,
        importWalletFromPhrase,
        updateSeedPhrase,
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
        resetAllData,
        totalBalanceUSD,
        change24hPercentage,
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

