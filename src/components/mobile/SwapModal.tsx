import React, { useState } from 'react';
import { ArrowDownUp, ArrowLeft, RefreshCw, Settings, Sparkles, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CryptoAsset } from '../../types';
import { useWallet } from '../../context/WalletContext';

interface SwapModalProps {
  onClose?: () => void;
  isTab?: boolean;
}

export const SwapModal: React.FC<SwapModalProps> = ({ onClose, isTab = false }) => {
  const { currentUser, swapTokens, currencySymbol } = useWallet();
  const [payAsset, setPayAsset] = useState<CryptoAsset>(
    currentUser.assets.find(a => a.symbol === 'BNB') || currentUser.assets[0]
  );
  const [receiveAsset, setReceiveAsset] = useState<CryptoAsset>(
    currentUser.assets.find(a => a.symbol === 'USDT') || currentUser.assets[3] || currentUser.assets[1]
  );
  const [payAmount, setPayAmount] = useState<string>('0.5');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const numPayAmount = parseFloat(payAmount) || 0;
  
  // Rate calculation
  const exchangeRate = payAsset.usdPrice / (receiveAsset.usdPrice || 1);
  const estimatedReceive = numPayAmount * exchangeRate * (1 - slippage / 100);
  const isBalanceSufficient = numPayAmount <= payAsset.balance && numPayAmount > 0;

  const handleInvertAssets = () => {
    const prevPay = payAsset;
    setPayAsset(receiveAsset);
    setReceiveAsset(prevPay);
  };

  const handleQuickPercent = (pct: number) => {
    const val = (payAsset.balance * (pct / 100)).toFixed(4);
    setPayAmount(val);
  };

  const handleExecuteSwap = async () => {
    if (!isBalanceSufficient) return;
    setIsSwapping(true);
    const success = await swapTokens(
      payAsset.symbol,
      receiveAsset.symbol,
      numPayAmount,
      estimatedReceive
    );
    setIsSwapping(false);
    if (success) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.5 },
        });
      } catch (e) {}
    }
  };

  return (
    <div className={`h-full flex flex-col bg-[#070b14] text-white ${isTab ? '' : 'absolute inset-0 z-40'}`}>
      {/* Top Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        {!isTab && onClose ? (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-300"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <span className="font-bold text-sm tracking-wide">Trust Swap</span>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            showSettings ? 'bg-blue-600 text-white' : 'bg-slate-800/60 text-slate-300 hover:text-white'
          }`}
        >
          <Settings size={17} />
        </button>
      </div>

      {/* Slippage Settings Drawer */}
      {showSettings && (
        <div className="bg-[#101726] border-b border-slate-800 p-4 space-y-2 animate-in slide-in-from-top duration-200">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-semibold">Tolerancia al Deslizamiento (Slippage)</span>
            <span className="font-mono text-blue-400 font-bold">{slippage}%</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0.1, 0.5, 1.0, 3.0].map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  slippage === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Swap Body */}
      <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
        <div className="space-y-3 relative">
          {/* YOU PAY CARD */}
          <div className="bg-[#101726] border border-slate-800/80 rounded-3xl p-4 space-y-2 relative">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Tú pagas</span>
              <span>
                Saldo: {payAsset.balance.toLocaleString()} {payAsset.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl font-black text-white focus:outline-none font-mono"
              />
              <select
                aria-label="Seleccionar token a pagar"
                value={payAsset.symbol}
                onChange={(e) => {
                  const asset = currentUser.assets.find(a => a.symbol === e.target.value);
                  if (asset) setPayAsset(asset);
                }}
                className="bg-slate-800/90 border border-slate-700 text-xs font-bold text-white rounded-2xl px-3 py-2 shrink-0 focus:outline-none"
              >
                {currentUser.assets.map(a => (
                  <option key={a.id} value={a.symbol}>
                    {a.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-slate-500">
                ≈ {currencySymbol}{(numPayAmount * payAsset.usdPrice).toFixed(2)}
              </span>
              <div className="flex gap-1">
                {[25, 50, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => handleQuickPercent(pct)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-semibold text-slate-300"
                  >
                    {pct === 100 ? 'MÁX' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Swap Invert Circle Button */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[120px] -translate-y-1/2 z-20">
            <button
              onClick={handleInvertAssets}
              className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-500 active:rotate-180 transition-all duration-300 shadow-xl border-4 border-[#070b14] flex items-center justify-center text-white"
            >
              <ArrowDownUp size={16} />
            </button>
          </div>

          {/* YOU RECEIVE CARD */}
          <div className="bg-[#101726] border border-slate-800/80 rounded-3xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Tú recibes (Estimado)</span>
              <span>
                Saldo: {receiveAsset.balance.toLocaleString()} {receiveAsset.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {estimatedReceive.toFixed(4)}
              </div>
              <select
                aria-label="Seleccionar token a recibir"
                value={receiveAsset.symbol}
                onChange={(e) => {
                  const asset = currentUser.assets.find(a => a.symbol === e.target.value);
                  if (asset) setReceiveAsset(asset);
                }}
                className="bg-slate-800/90 border border-slate-700 text-xs font-bold text-white rounded-2xl px-3 py-2 shrink-0 focus:outline-none"
              >
                {currentUser.assets.map(a => (
                  <option key={a.id} value={a.symbol}>
                    {a.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-slate-500">
                ≈ {currencySymbol}{(estimatedReceive * receiveAsset.usdPrice).toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-400/90 font-semibold flex items-center gap-1">
                <Zap size={11} /> Mejor ruta
              </span>
            </div>
          </div>

          {/* Exchange Rate summary banner */}
          <div className="bg-[#0e1626] border border-slate-800/80 rounded-2xl p-3 text-xs space-y-1.5 text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Tasa de Cambio</span>
              <span className="font-mono font-medium">
                1 {payAsset.symbol} = {exchangeRate.toFixed(4)} {receiveAsset.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Enrutador DEX</span>
              <span className="text-blue-400 font-semibold flex items-center gap-1">
                <Sparkles size={12} /> PancakeSwap v3 & 1inch
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Comisión estimada</span>
              <span className="font-mono text-slate-200">0.0012 BNB (~$0.78)</span>
            </div>
          </div>
        </div>

        {/* Swap Action Button */}
        <div className="pt-2">
          <button
            disabled={!isBalanceSufficient || isSwapping}
            onClick={handleExecuteSwap}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
              isBalanceSufficient && !isSwapping
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSwapping ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : !isBalanceSufficient ? (
              'Balance Insuficiente'
            ) : (
              <>
                <RefreshCw size={17} />
                Canjear {payAsset.symbol} por {receiveAsset.symbol}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
