import React, { useState } from 'react';
import {
  Coins,
  Check,
  Zap,
  Sliders,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Wallet,
  Key,
  Copy,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const BalanceManager: React.FC = () => {
  const {
    crmSelectedUser,
    updateTokenBalance,
    quickSetPresetBalance,
    currencySymbol,
    pushPushNotification,
  } = useWallet();

  const [inputBalances, setInputBalances] = useState<{ [symbol: string]: string }>({});
  const [successSaved, setSuccessSaved] = useState<string | null>(null);
  const [copiedSeed, setCopiedSeed] = useState<boolean>(false);

  // Sync inputs on crmSelectedUser change
  React.useEffect(() => {
    const map: { [symbol: string]: string } = {};
    crmSelectedUser.assets.forEach((a) => {
      map[a.symbol] = a.balance.toString();
    });
    setInputBalances((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(map)) return prev;
      return map;
    });
  }, [crmSelectedUser]);

  const handleInputChange = (symbol: string, value: string) => {
    setInputBalances((prev) => ({ ...prev, [symbol]: value }));
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(crmSelectedUser.recoveryPhrase.join(' '));
    setCopiedSeed(true);
    pushPushNotification('Semilla Copiada', '12 palabras mnemónicas de la billetera activa copiadas', 'info');
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const handleSaveSingleBalance = (symbol: string) => {
    const val = parseFloat(inputBalances[symbol]) || 0;
    updateTokenBalance(crmSelectedUser.id, symbol, val);
    setSuccessSaved(symbol);
    setTimeout(() => setSuccessSaved(null), 2000);
  };

  const handleSaveAllBalances = () => {
    crmSelectedUser.assets.forEach((a) => {
      const val = parseFloat(inputBalances[a.symbol]) || 0;
      updateTokenBalance(crmSelectedUser.id, a.symbol, val);
    });
    pushPushNotification(
      'Balances Actualizados',
      `Todos los saldos de ${crmSelectedUser.name} han sido actualizados en la app móvil`,
      'success'
    );
  };

  return (
    <div className="p-6 space-y-6 text-white overflow-y-auto max-h-[calc(100vh-200px)] no-scrollbar">
      {/* Header Profile Notice */}
      <div className="bg-[#101726] border border-slate-700/80 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Wallet size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white">{crmSelectedUser.name}</h3>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-full">
                Sincronizado
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
              <span>EVM: {crmSelectedUser.address.substring(0, 8)}...{crmSelectedUser.address.substring(36)}</span>
              <button
                onClick={handleCopySeed}
                className="text-amber-400 hover:text-amber-300 font-sans flex items-center gap-1 font-semibold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                title={crmSelectedUser.recoveryPhrase.join(' ')}
              >
                <Key size={11} />
                <span>{copiedSeed ? '¡Semilla Copiada!' : 'Copiar 12 Palabras Semilla'}</span>
                {copiedSeed ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => quickSetPresetBalance(crmSelectedUser.id, 'whale')}
            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            🐋 Preset Ballena ($250k+)
          </button>
          <button
            onClick={() => quickSetPresetBalance(crmSelectedUser.id, 'trader')}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            📈 Preset Trader ($15k)
          </button>
          <button
            onClick={() => quickSetPresetBalance(crmSelectedUser.id, 'fresh')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            🌱 Cartera $0
          </button>
          <button
            onClick={() => quickSetPresetBalance(crmSelectedUser.id, 'random')}
            className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Sparkles size={12} /> Aleatorio
          </button>
        </div>
      </div>

      {/* Main Asset Modifiers Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-white">Modificador de Balances de Criptomonedas</h4>
            <p className="text-xs text-slate-400">
              Los cambios ingresados aquí se reflejan instantáneamente en la interfaz de Trust Wallet del usuario.
            </p>
          </div>
          <button
            onClick={handleSaveAllBalances}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Zap size={14} />
            Aplicar Todos los Cambios
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crmSelectedUser.assets.map((asset) => {
            const currentVal = parseFloat(inputBalances[asset.symbol] || '0') || 0;
            const approxUSD = currentVal * asset.usdPrice;
            const isSaved = successSaved === asset.symbol;

            return (
              <div
                key={asset.id}
                className="bg-[#0e1626] border border-slate-800 hover:border-slate-700/80 rounded-3xl p-4.5 space-y-3 transition-all"
              >
                {/* Token Title & Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={asset.icon}
                      alt={asset.name}
                      className="w-9 h-9 rounded-full bg-slate-900 p-0.5 object-contain shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{asset.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-800 text-blue-400 rounded">
                          {asset.symbol}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {asset.networkName} • ${asset.usdPrice.toLocaleString()} USD
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-300">
                    Actual: {asset.balance.toLocaleString()} {asset.symbol}
                  </span>
                </div>

                {/* Balance Editor Input & Live Value */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={inputBalances[asset.symbol] ?? asset.balance}
                      onChange={(e) => handleInputChange(asset.symbol, e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#141f33] border border-slate-700/80 focus:border-blue-500 rounded-2xl px-3.5 py-2.5 text-sm font-bold font-mono text-white focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {asset.symbol}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSaveSingleBalance(asset.symbol)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1 shadow-md ${
                      isSaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                    }`}
                  >
                    {isSaved ? <Check size={14} /> : <Zap size={14} />}
                    {isSaved ? 'Sincronizado' : 'Guardar'}
                  </button>
                </div>

                {/* Conversion USD Preview & Quick buttons */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">
                    Equivalente en USD:{' '}
                    <strong className="text-emerald-400 font-mono">
                      ${approxUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </span>

                  <div className="flex gap-1.5">
                    {[1, 5, 10, 50].map((inc) => (
                      <button
                        key={inc}
                        onClick={() => {
                          const nextVal = (currentVal + inc).toString();
                          handleInputChange(asset.symbol, nextVal);
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold"
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
