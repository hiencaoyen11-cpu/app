export type NetworkType = 'bitcoin' | 'ethereum' | 'binance' | 'solana' | 'polygon' | 'avalanche';

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  network: NetworkType;
  networkName: string;
  icon: string;
  balance: number;
  usdPrice: number;
  change24h: number;
  contractAddress?: string;
  decimals: number;
  color: string;
}

export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type TransactionType = 'send' | 'receive' | 'swap' | 'contract' | 'reward';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  assetSymbol: string;
  assetName: string;
  amount: number;
  usdValue: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string; // ISO string or editable date
  status: TransactionStatus;
  txHash: string;
  networkFee: number;
  networkFeeAsset: string;
  network: NetworkType;
  nonce?: number;
  blockNumber?: number;
  note?: string;
}

export interface UserWallet {
  id: string;
  name: string;
  address: string; // EVM address format
  btcAddress: string;
  solAddress: string;
  createdAt: string;
  deviceModel: string;
  ipAddress: string;
  lastActive: string;
  pinCode: string;
  biometricsEnabled: boolean;
  recoveryPhrase: string[];
  assets: CryptoAsset[];
  customAvatar?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'BALANCE_MODIFIED' | 'TRANSACTION_GENERATED' | 'TRANSACTION_SENT' | 'SECURITY_UPDATED' | 'USER_SWITCHED' | 'DAPP_CONNECTED' | 'SETTINGS_CHANGED';
  admin: string;
  userId: string;
  details: string;
  previousValue?: any;
  newValue?: any;
}

export interface DAppItem {
  id: string;
  name: string;
  category: 'DeFi' | 'NFT' | 'Dex' | 'Staking' | 'Games';
  url: string;
  description: string;
  icon: string;
  bannerColor: string;
  network: NetworkType;
}

export interface WalletConnectSession {
  id: string;
  dappName: string;
  dappUrl: string;
  dappIcon: string;
  connectedAt: string;
  network: NetworkType;
  status: 'active' | 'pending' | 'disconnected';
}
