import React, { useState } from 'react';
import { Eye, EyeOff, Bell, QrCode, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, CreditCard, ChevronDown, Plus, Search, ShieldCheck, History, Headphones } from 'lucide-react';
import { CryptoAsset, Transaction } from '../../types';
import { useWallet } from '../../context/WalletContext';
import { openTawkSupportChat } from '../../utils/tawk';

interface WalletDashboardProps {
  onOpenReceive: (asset?: CryptoAsset) => void;
  onOpenSend: (asset?: CryptoAsset) => void;
  onOpenSwap: () => void;
  onOpenHistory: () => void;
  onOpenUserModal: () => void;
  onOpenBuy: (asset?: CryptoAsset) => void;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({
  onOpenReceive,
  onOpenSend,
  onOpenSwap,
  onOpenHistory,
  onOpenUserModal,
  onOpenBuy,
}) => {
  const {
    currentUser,
    totalBalanceUSD,
    change24hPercentage,
    hideBalance,
    toggleHideBalance,
    currencySymbol,
    currencyRate,
    pushPushNotification,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<'crypto' | 'nfts'>('crypto');
  const [searchToken, setSearchToken] = useState<string>('');

  const displayTotal = (totalBalanceUSD * currencyRate).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const filteredAssets = currentUser.assets.filter(
    (a) =>
      a.name.toLowerCase().includes(searchToken.toLowerCase()) ||
      a.symbol.toLowerCase().includes(searchToken.toLowerCase())
  );

  const isGain = change24hPercentage >= 0;

  return (
    <div className="flex flex-col h-full bg-[#050811] text-white overflow-y-auto no-scrollbar">
      {/* Top Bar */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/40 shrink-0">
        {/* Wallet Selector Dropdown */}
        <button
          onClick={onOpenUserModal}
          className="flex items-center gap-2 py-1.5 px-3 bg-[#101726] hover:bg-[#182338] border border-slate-700/60 rounded-full transition-all text-xs font-semibold"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="max-w-[130px] truncate">{currentUser.name}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {/* Right Top Icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              openTawkSupportChat({
                name: currentUser.name,
                address: currentUser.address,
              })
            }
            className="w-9 h-9 rounded-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 transition-colors relative"
            title="Soporte en Vivo 24/7 (Tawk)"
          >
            <Headphones size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#101726] animate-pulse" />
          </button>
          <button
            onClick={onOpenHistory}
            className="w-9 h-9 rounded-full bg-[#101726] hover:bg-slate-800 flex items-center justify-center text-slate-300 transition-colors"
            title="Historial de Transacciones"
          >
            <History size={17} />
          </button>
          <button
            onClick={() => onOpenReceive()}
            className="w-9 h-9 rounded-full bg-[#101726] hover:bg-slate-800 flex items-center justify-center text-slate-300 transition-colors"
            title="Escanear Código QR"
          >
            <QrCode size={17} />
          </button>
        </div>
      </div>

      {/* Main Balance Display Section */}
      <div className="px-5 pt-5 pb-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <span>Saldo Total de la Cartera</span>
          <button
            onClick={toggleHideBalance}
            className="p-1 hover:text-white transition-colors"
          >
            {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <div className="mt-1 text-3xl font-extrabold tracking-tight text-white font-mono">
          {hideBalance ? (
            '••••••••'
          ) : (
            <>
              <span className="text-2xl text-blue-400 font-sans mr-0.5">{currencySymbol}</span>
              {displayTotal}
            </>
          )}
        </div>

        {/* 24h Change Pill */}
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              isGain
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isGain ? '+' : ''}{change24hPercentage.toFixed(2)}% (24h)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {currentUser.address.substring(0, 6)}...{currentUser.address.substring(38)}
          </span>
        </div>
      </div>

      {/* Trust Wallet Signature 4 Main Actions */}
      <div className="px-5 py-2 grid grid-cols-4 gap-3">
        {/* ENVIAR */}
        <button
          onClick={() => onOpenSend()}
          className="flex flex-col items-center gap-1.5 group active:scale-95 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-[#0052FF] group-hover:bg-[#0045d8] shadow-lg shadow-blue-600/30 flex items-center justify-center text-white transition-all">
            <ArrowUpRight size={22} />
          </div>
          <span className="text-xs font-semibold text-slate-200">Enviar</span>
        </button>

        {/* RECIBIR */}
        <button
          onClick={() => onOpenReceive()}
          className="flex flex-col items-center gap-1.5 group active:scale-95 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-[#0052FF] group-hover:bg-[#0045d8] shadow-lg shadow-blue-600/30 flex items-center justify-center text-white transition-all">
            <ArrowDownLeft size={22} />
          </div>
          <span className="text-xs font-semibold text-slate-200">Recibir</span>
        </button>

        {/* CANJEAR / SWAP */}
        <button
          onClick={onOpenSwap}
          className="flex flex-col items-center gap-1.5 group active:scale-95 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-[#0052FF] group-hover:bg-[#0045d8] shadow-lg shadow-blue-600/30 flex items-center justify-center text-white transition-all">
            <ArrowLeftRight size={20} />
          </div>
          <span className="text-xs font-semibold text-slate-200">Canjear</span>
        </button>

        {/* COMPRAR */}
        <button
          onClick={() => onOpenBuy()}
          className="flex flex-col items-center gap-1.5 group active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-[#0052FF] group-hover:bg-[#0045d8] shadow-lg shadow-blue-600/30 flex items-center justify-center text-white transition-all">
            <CreditCard size={20} />
          </div>
          <span className="text-xs font-semibold text-slate-200">Comprar</span>
        </button>
      </div>

      {/* Tabs: Cripto / NFTs */}
      <div className="px-4 mt-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('crypto')}
            className={`pb-2.5 text-xs font-bold relative transition-colors ${
              activeTab === 'crypto' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Criptomonedas
            {activeTab === 'crypto' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('nfts')}
            className={`pb-2.5 text-xs font-bold relative transition-colors ${
              activeTab === 'nfts' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            NFTs y Coleccionables
            {activeTab === 'nfts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Asset Search Filter */}
      {activeTab === 'crypto' && (
        <div className="px-4 pt-3 pb-1">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar criptomonedas..."
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="w-full bg-[#0e1626] border border-slate-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Token List */}
      {activeTab === 'crypto' ? (
        <div className="flex-1 px-3 py-2 divide-y divide-slate-800/40">
          {filteredAssets.map((asset) => {
            const assetTotalUSD = asset.balance * asset.usdPrice * currencyRate;
            const isAssetGain = asset.change24h >= 0;

            return (
              <div
                key={asset.id}
                className="py-3 px-2 flex items-center justify-between hover:bg-[#0e1626]/80 rounded-2xl transition-all cursor-pointer group"
                onClick={() => onOpenReceive(asset)}
              >
                {/* Left: Icon & Token Name */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={asset.icon}
                      alt={asset.name}
                      className="w-10 h-10 rounded-full shadow-md object-contain bg-slate-900"
                    />
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#050811] flex items-center justify-center text-[8px] font-black text-white"
                      style={{ backgroundColor: asset.color }}
                    >
                      {asset.symbol[0]}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors">
                        {asset.name}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                        {asset.symbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] mt-0.5">
                      <span className="text-slate-400 font-mono">
                        {currencySymbol}{(asset.usdPrice * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span
                        className={`font-semibold ${
                          isAssetGain ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isAssetGain ? '+' : ''}{asset.change24h}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Balances */}
                <div className="text-right">
                  <div className="font-bold text-xs text-white font-mono">
                    {hideBalance ? '••••' : asset.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {hideBalance
                      ? '••••'
                      : `${currencySymbol}${assetTotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Manage Crypto Button */}
          <div className="pt-4 pb-6 flex justify-center">
            <button
              onClick={() => pushPushNotification('Gestor de Tokens', 'Puedes añadir tokens personalizados ERC20 / BEP20 o modificar balances desde el CRM', 'info')}
              className="py-2 px-4 bg-[#101726] hover:bg-[#182338] border border-slate-800 rounded-full text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} className="text-blue-400" />
              Administrar Cripto
            </button>
          </div>
        </div>
      ) : (
        /* NFTs Tab */
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
          <div className="w-14 h-14 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
            <Plus size={24} />
          </div>
          <p className="font-bold text-white text-sm">Sin Coleccionables NFT</p>
          <p className="text-slate-400 mt-1 max-w-[220px]">
            Tus coleccionables de OpenSea y redes compatibles aparecerán aquí.
          </p>
        </div>
      )}
    </div>
  );
};
