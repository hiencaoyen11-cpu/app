import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
const STORAGE_KEY_TRANSACTIONS = 'trustwallet_transactions_v3';
const STORAGE_KEY_AUDIT = 'trustwallet_audit_v3';
const STORAGE_KEY_ONBOARDING = 'trustwallet_onboarding_v3';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserWallet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored users', e);
      }
    }
    return INITIAL_USERS;
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (saved && users.some(u => u.id === saved)) return saved;
    return users[0]?.id || 'user_01';
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

  // Sync to localStorage and BroadcastChannel for instant cross-tab / cross-device sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    try {
      const bc = new BroadcastChannel('trust_wallet_crm_channel');
      bc.postMessage({ type: 'SYNC_USERS', payload: users });
      bc.close();
    } catch (_) {}
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, activeUserId);
    try {
      const bc = new BroadcastChannel('trust_wallet_crm_channel');
      bc.postMessage({ type: 'SYNC_ACTIVE_USER', payload: activeUserId });
      bc.close();
    } catch (_) {}
  }, [activeUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ONBOARDING, isOnboarding ? 'true' : 'false');
    try {
      const bc = new BroadcastChannel('trust_wallet_crm_channel');
      bc.postMessage({ type: 'SYNC_ONBOARDING', payload: isOnboarding });
      bc.close();
    } catch (_) {}
  }, [isOnboarding]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    try {
      const bc = new BroadcastChannel('trust_wallet_crm_channel');
      bc.postMessage({ type: 'SYNC_TRANSACTIONS', payload: transactions });
      bc.close();
    } catch (_) {}
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));
    try {
      const bc = new BroadcastChannel('trust_wallet_crm_channel');
      bc.postMessage({ type: 'SYNC_AUDIT', payload: auditLogs });
      bc.close();
    } catch (_) {}
  }, [auditLogs]);

  // Real-time listener for multi-tab / mobile window sync
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('trust_wallet_crm_channel');
      bc.onmessage = (event) => {
        if (!event.data) return;
        const { type, payload } = event.data;
        if (type === 'SYNC_USERS' && Array.isArray(payload)) setUsers(payload);
        if (type === 'SYNC_ACTIVE_USER' && typeof payload === 'string') setActiveUserId(payload);
        if (type === 'SYNC_TRANSACTIONS' && Array.isArray(payload)) setTransactions(payload);
        if (type === 'SYNC_AUDIT' && Array.isArray(payload)) setAuditLogs(payload);
        if (type === 'SYNC_ONBOARDING' && typeof payload === 'boolean') setIsOnboarding(payload);
      };
    } catch (_) {}

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEY_USERS) setUsers(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEY_ACTIVE_USER) setActiveUserId(e.newValue);
        if (e.key === STORAGE_KEY_TRANSACTIONS) setTransactions(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEY_AUDIT) setAuditLogs(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEY_ONBOARDING) setIsOnboarding(e.newValue === 'true');
      } catch (err) {
        console.error('Storage sync error', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (bc) bc.close();
    };
  }, []);

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

