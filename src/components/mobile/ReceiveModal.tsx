import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Copy, Check, Share2, ExternalLink, SlidersHorizontal, AlertTriangle, CreditCard } from 'lucide-react';
import { CryptoAsset, UserWallet } from '../../types';
import { useWallet } from '../../context/WalletContext';

interface ReceiveModalProps {
  onClose: () => void;
  initialAsset?: CryptoAsset;
  onOpenBuy?: (asset?: CryptoAsset) => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({ onClose, initialAsset, onOpenBuy }) => {
  const { currentUser, pushPushNotification } = useWallet();
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>(
    initialAsset || currentUser.assets[0]
  );
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showAmountInput, setShowAmountInput] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Address depending on chain
  const getAddress = (asset: CryptoAsset, user: UserWallet) => {
    if (asset.network === 'bitcoin') return user.btcAddress;
    if (asset.network === 'solana') return user.solAddress;
    return user.address; // EVM address for ETH, BNB, MATIC, AVAX, USDT
  };

  const currentAddress = getAddress(selectedAsset, currentUser);
  const qrValue = customAmount && Number(customAmount) > 0
    ? `${selectedAsset.symbol.toLowerCase()}:${currentAddress}?amount=${customAmount}`
    : currentAddress;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    pushPushNotification('Dirección Copiada', `Copiado: ${currentAddress.substring(0, 10)}...`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Mi dirección de ${selectedAsset.name}`,
        text: `Envíame ${selectedAsset.symbol} a esta dirección: ${currentAddress}`,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="absolute inset-0 bg-[#070b14] z-40 flex flex-col overflow-y-auto text-white animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-300"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="font-bold text-sm tracking-wide">
          Recibir {selectedAsset.symbol}
        </span>
        <div className="w-9" />
      </div>

      {/* Asset Selector Pills */}
      <div className="px-4 py-3 border-b border-slate-800/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {currentUser.assets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => setSelectedAsset(asset)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
              selectedAsset.id === asset.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <img src={asset.icon} alt={asset.symbol} className="w-4 h-4 rounded-full" />
            <span>{asset.symbol}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 flex flex-col items-center justify-center gap-4">
        {/* QR Card */}
        <div className="bg-white p-5 rounded-3xl shadow-2xl flex flex-col items-center justify-center relative">
          <QRCodeSVG
            value={qrValue}
            size={190}
            level="H"
            includeMargin={false}
          />
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <img src={selectedAsset.icon} alt={selectedAsset.symbol} className="w-4 h-4 rounded-full" />
            <span>{selectedAsset.networkName}</span>
          </div>
        </div>

        {/* Address Display Box */}
        <div className="w-full bg-[#101726] border border-slate-700/60 rounded-2xl p-3.5 flex flex-col gap-1 text-center">
          <span className="text-[11px] font-medium text-slate-400">
            Tu dirección de recepción de {selectedAsset.symbol}
          </span>
          <p className="text-xs font-mono text-blue-300 break-all select-all font-semibold leading-relaxed">
            {currentAddress}
          </p>
        </div>

        {/* Warning Network Notice */}
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start gap-2.5 text-left">
          <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/90 leading-tight">
            Envía únicamente <strong>{selectedAsset.name} ({selectedAsset.symbol})</strong> a esta dirección. Enviar otros tokens causará pérdidas permanentes.
          </p>
        </div>

        {/* Custom Amount Modal Input */}
        {showAmountInput && (
          <div className="w-full bg-[#121c2e] border border-blue-500/40 rounded-xl p-3 flex flex-col gap-2 animate-in fade-in">
            <span className="text-xs text-slate-300 font-medium">Fijar cantidad solicitada</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="0.0"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-xs font-bold text-blue-400">{selectedAsset.symbol}</span>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="w-full grid grid-cols-3 gap-2.5 mt-1">
          <button
            onClick={handleCopy}
            className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 bg-[#121c2e] hover:bg-[#18263e] active:scale-95 border border-slate-700/60 rounded-2xl transition-all"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-600/20 text-blue-400'}`}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </div>
            <span className="text-[11px] font-semibold text-slate-200">
              {copied ? 'Copiado' : 'Copiar'}
            </span>
          </button>

          <button
            onClick={() => setShowAmountInput(!showAmountInput)}
            className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 bg-[#121c2e] hover:bg-[#18263e] active:scale-95 border border-slate-700/60 rounded-2xl transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <SlidersHorizontal size={16} />
            </div>
            <span className="text-[11px] font-semibold text-slate-200">
              Fijar monto
            </span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 bg-[#121c2e] hover:bg-[#18263e] active:scale-95 border border-slate-700/60 rounded-2xl transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Share2 size={16} />
            </div>
            <span className="text-[11px] font-semibold text-slate-200">
              Compartir
            </span>
          </button>
        </div>

        {/* Buy with Bank Transfer Mini Checkout Shortcut */}
        {onOpenBuy && (
          <div className="w-full pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenBuy(selectedAsset);
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 border border-blue-400/40 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CreditCard size={15} />
              <span>Comprar {selectedAsset.symbol} (Mini Checkout Bancario)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
