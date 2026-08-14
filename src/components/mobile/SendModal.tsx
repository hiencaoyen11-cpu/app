import React, { useState } from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, ChevronRight, Clipboard, Fuel, QrCode, Sparkles, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CryptoAsset } from '../../types';
import { useWallet } from '../../context/WalletContext';

interface SendModalProps {
  onClose: () => void;
  initialAsset?: CryptoAsset;
}

export const SendModal: React.FC<SendModalProps> = ({ onClose, initialAsset }) => {
  const { currentUser, sendCrypto, currencySymbol } = useWallet();
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>(
    initialAsset || currentUser.assets[0]
  );
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [gasSpeed, setGasSpeed] = useState<'slow' | 'standard' | 'fast'>('standard');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const numAmount = parseFloat(amount) || 0;
  const usdValue = numAmount * selectedAsset.usdPrice;
  const isBalanceSufficient = numAmount <= selectedAsset.balance && numAmount > 0;

  const gasFeeMultiplier = gasSpeed === 'slow' ? 0.8 : gasSpeed === 'fast' ? 1.5 : 1.0;
  const baseGasFee = selectedAsset.network === 'bitcoin' ? 0.00012 : selectedAsset.network === 'binance' ? 0.0015 : 0.0028;
  const calculatedGasFee = baseGasFee * gasFeeMultiplier;

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRecipientAddress(text.trim());
      }
    } catch {
      // Fallback sample address
      setRecipientAddress('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    }
  };

  const handleFillDemoAddress = () => {
    if (selectedAsset.network === 'bitcoin') {
      setRecipientAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    } else if (selectedAsset.network === 'solana') {
      setRecipientAddress('5pL7N8v2K9jXq1rC3sT4uW5yZ6aB7cD8eF9gH1iJ2kL');
    } else {
      setRecipientAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    }
  };

  const handleSetPercentage = (percent: number) => {
    const val = (selectedAsset.balance * (percent / 100)).toFixed(selectedAsset.decimals > 8 ? 6 : 4);
    setAmount(val);
  };

  const handleConfirmSend = async () => {
    if (!isBalanceSufficient || !recipientAddress) return;
    setIsSubmitting(true);

    const success = await sendCrypto(
      selectedAsset.symbol,
      recipientAddress,
      numAmount,
      memo
    );

    setIsSubmitting(false);
    if (success) {
      setStep('success');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  };

  return (
    <div className="absolute inset-0 bg-[#070b14] z-40 flex flex-col text-white animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <button
          onClick={step === 'confirm' ? () => setStep('input') : onClose}
          className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-300"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="font-bold text-sm tracking-wide">
          {step === 'input' && `Enviar ${selectedAsset.symbol}`}
          {step === 'confirm' && 'Confirmar Transacción'}
          {step === 'success' && '¡Envío Exitoso!'}
        </span>
        <div className="w-9" />
      </div>

      {step === 'input' && (
        <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Token Selector */}
            <div className="bg-[#101726] border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={selectedAsset.icon} alt={selectedAsset.symbol} className="w-9 h-9 rounded-full" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">{selectedAsset.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/40 text-blue-300 rounded font-medium">
                      {selectedAsset.network.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Disponible: {selectedAsset.balance.toLocaleString()} {selectedAsset.symbol}
                  </p>
                </div>
              </div>
              <select
                aria-label="Seleccionar Criptoactivo"
                value={selectedAsset.symbol}
                onChange={(e) => {
                  const asset = currentUser.assets.find(a => a.symbol === e.target.value);
                  if (asset) setSelectedAsset(asset);
                }}
                className="bg-slate-800/80 border border-slate-700 text-xs font-semibold text-white rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                {currentUser.assets.map(a => (
                  <option key={a.id} value={a.symbol}>
                    {a.symbol} ({a.balance})
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Dirección de destino</span>
                <button
                  onClick={handleFillDemoAddress}
                  className="text-blue-400 text-[11px] hover:underline"
                >
                  Usar demo
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={`Dirección o nombre de dominio (${selectedAsset.network})`}
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full bg-[#101726] border border-slate-700/80 rounded-2xl px-3.5 py-3 pr-20 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    onClick={handlePasteAddress}
                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    <Clipboard size={12} /> Pegar
                  </button>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Monto a transferir</span>
                <span className="text-slate-400">
                  ≈ {currencySymbol}{usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#101726] border border-slate-700/80 rounded-2xl px-4 py-3.5 pr-20 text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="absolute right-4 text-xs font-bold text-slate-400">
                  {selectedAsset.symbol}
                </span>
              </div>

              {/* Percentage shortcuts */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handleSetPercentage(pct)}
                    className="py-1 bg-slate-800/60 hover:bg-blue-600/30 border border-slate-700/50 rounded-xl text-[11px] font-semibold text-slate-300 transition-colors"
                  >
                    {pct === 100 ? 'MÁX' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Memo / Note */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Nota / Memo (Opcional)</span>
              <input
                type="text"
                placeholder="Ej. Pago de servicios o factura #482"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full bg-[#101726] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <button
              disabled={!isBalanceSufficient || !recipientAddress}
              onClick={() => setStep('confirm')}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                isBalanceSufficient && recipientAddress
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Continuar
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Amount Big Hero */}
            <div className="text-center py-4 bg-[#101726]/60 rounded-3xl border border-slate-800">
              <span className="text-3xl font-extrabold text-white">
                -{numAmount} {selectedAsset.symbol}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                ≈ {currencySymbol}{usdValue.toFixed(2)} USD
              </p>
            </div>

            {/* Details Table */}
            <div className="bg-[#101726] border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">De (Tu Billetera)</span>
                <span className="font-mono text-slate-200 truncate max-w-[170px]">
                  {currentUser.address}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Para</span>
                <span className="font-mono text-blue-300 truncate max-w-[170px]">
                  {recipientAddress}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Red Blockchain</span>
                <span className="font-semibold text-slate-200 uppercase">
                  {selectedAsset.networkName}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Fuel size={13} className="text-amber-400" /> Tarifa de Red estimada
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {calculatedGasFee.toFixed(6)} {selectedAsset.network === 'binance' ? 'BNB' : 'ETH'}
                </span>
              </div>
            </div>

            {/* Gas Speed Selector */}
            <div className="bg-[#101726] border border-slate-800 rounded-2xl p-3 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400">Velocidad de Confirmación</span>
              <div className="grid grid-cols-3 gap-2">
                {(['slow', 'standard', 'fast'] as const).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setGasSpeed(spd)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                      gasSpeed === spd
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd === 'slow' ? 'Lento' : spd === 'standard' ? 'Estándar' : 'Rápido ⚡'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-4">
            <button
              disabled={isSubmitting}
              onClick={handleConfirmSend}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-blue-600/30 active:scale-98 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowUpRight size={18} />
                  Confirmar y Enviar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={36} />
          </div>
          <h3 className="text-xl font-bold text-white">Transacción Enviada</h3>
          <p className="text-xs text-slate-300 max-w-[260px] leading-relaxed">
            Se han transferido exitosamente <strong>{numAmount} {selectedAsset.symbol}</strong> a la red blockchain.
          </p>
          <div className="w-full bg-[#101726] border border-slate-800 rounded-2xl p-3 text-left text-xs font-mono text-slate-400 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Destino</div>
            <div className="truncate text-blue-300">{recipientAddress}</div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg mt-4"
          >
            Volver a la Billetera
          </button>
        </div>
      )}
    </div>
  );
};
