import React, { useState } from 'react';
import {
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Fuel,
  Bell,
  Fingerprint,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Transaction, TransactionStatus, TransactionType } from '../../types';
import { useWallet } from '../../context/WalletContext';

export const TransactionGenerator: React.FC = () => {
  const {
    currentUser,
    users,
    createCustomTransaction,
    currencySymbol,
    pushPushNotification,
  } = useWallet();

  const [targetUserId, setTargetUserId] = useState<string>(currentUser.id);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [txType, setTxType] = useState<TransactionType>('receive');
  const [amount, setAmount] = useState<string>('0.25');
  const [fromAddress, setFromAddress] = useState<string>('0x1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  const [toAddress, setToAddress] = useState<string>(currentUser.address);
  const [txStatus, setTxStatus] = useState<TransactionStatus>('completed');
  const [customTimestamp, setCustomTimestamp] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [customGasFee, setCustomGasFee] = useState<string>('0.00015');
  const [customNote, setCustomNote] = useState<string>('Transferencia confirmada desde CRM');
  const [triggerPush, setTriggerPush] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const selectedUser = users.find((u) => u.id === targetUserId) || currentUser;
  const targetAsset = selectedUser.assets.find((a) => a.symbol === selectedSymbol) || selectedUser.assets[0];

  // Quick preset generators for addresses
  const handleRandomFrom = () => {
    setFromAddress('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
  };

  const handleSetToMyAddress = () => {
    if (targetAsset.network === 'bitcoin') {
      setToAddress(selectedUser.btcAddress);
    } else if (targetAsset.network === 'solana') {
      setToAddress(selectedUser.solAddress);
    } else {
      setToAddress(selectedUser.address);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    setIsGenerating(true);

    const newTxData: Omit<Transaction, 'id'> = {
      userId: targetUserId,
      type: txType,
      assetSymbol: targetAsset.symbol,
      assetName: targetAsset.name,
      amount: numAmount,
      usdValue: numAmount * targetAsset.usdPrice,
      fromAddress: fromAddress || '0xSystemMinter',
      toAddress: toAddress || selectedUser.address,
      timestamp: new Date(customTimestamp).toISOString(),
      status: txStatus,
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      networkFee: parseFloat(customGasFee) || 0.0001,
      networkFeeAsset: targetAsset.network === 'binance' ? 'BNB' : targetAsset.network === 'ethereum' ? 'ETH' : targetAsset.symbol,
      network: targetAsset.network,
      blockNumber: Math.floor(Math.random() * 500000) + 38000000,
      note: customNote,
    };

    setTimeout(() => {
      createCustomTransaction(newTxData, triggerPush);
      setIsGenerating(false);
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.4 },
        });
      } catch (e) {}
    }, 300);
  };

  return (
    <div className="p-6 space-y-6 text-white overflow-y-auto max-h-[calc(100vh-200px)] no-scrollbar">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101726] border border-slate-700/80 rounded-3xl p-5">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <Sparkles size={18} className="text-blue-400" />
            Generador Avanzado de Transacciones Blockchain
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Crea depósitos, envíos, canjes y airdrops en tiempo real con montos, fechas y estados personalizados.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN: CORE TRANSACTION SETTINGS */}
        <div className="bg-[#0e1626] border border-slate-800 rounded-3xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Parámetros Principales
          </h4>

          {/* User Target Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Usuario / Billetera Destino</label>
            <select
              aria-label="Usuario / Billetera Destino"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.address.substring(0, 10)}... ({u.deviceModel})
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Tipo de Transacción</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'receive', label: 'Recibir / Depósito', icon: ArrowDownLeft, color: 'text-emerald-400' },
                { id: 'send', label: 'Envío / Retiro', icon: ArrowUpRight, color: 'text-rose-400' },
                { id: 'swap', label: 'Canje / Swap', icon: ArrowLeftRight, color: 'text-cyan-400' },
              ].map((t) => {
                const Icon = t.icon;
                const isSel = txType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTxType(t.id as any)}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      isSel
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-[#141f33] border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={isSel ? 'text-blue-400' : t.color} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asset & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Criptomoneda</label>
              <select
                aria-label="Criptomoneda"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none"
              >
                {selectedUser.assets.map((a) => (
                  <option key={a.id} value={a.symbol}>
                    {a.name} ({a.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">
                Monto ({selectedSymbol})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Amount in USD preview */}
          <div className="p-3 bg-[#111a2d] border border-slate-800 rounded-2xl flex justify-between items-center text-xs">
            <span className="text-slate-400">Valor Estimado en USD:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              ${((parseFloat(amount) || 0) * targetAsset.usdPrice).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              USD
            </span>
          </div>

          {/* Transaction Status Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Estado de la Transacción</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'completed', label: 'Completada', icon: CheckCircle2, bg: 'text-emerald-400' },
                { id: 'pending', label: 'Pendiente', icon: Clock, bg: 'text-amber-400' },
                { id: 'failed', label: 'Fallida', icon: XCircle, bg: 'text-rose-400' },
              ].map((st) => {
                const Icon = st.icon;
                const isSel = txStatus === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setTxStatus(st.id as any)}
                    className={`py-2 px-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isSel
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                        : 'bg-[#141f33] border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={14} className={isSel ? 'text-white' : st.bg} />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ADDRESSES, TIMESTAMPS & EMIT */}
        <div className="bg-[#0e1626] border border-slate-800 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              2. Direcciones, Tiempo y Opciones
            </h4>

            {/* From Address */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>Dirección Remitente (From)</span>
                <button
                  type="button"
                  onClick={handleRandomFrom}
                  className="text-blue-400 text-[11px] hover:underline"
                >
                  Generar aleatoria
                </button>
              </div>
              <input
                type="text"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* To Address */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>Dirección Destinatario (To)</span>
                <button
                  type="button"
                  onClick={handleSetToMyAddress}
                  className="text-blue-400 text-[11px] hover:underline"
                >
                  Usar billetera del usuario
                </button>
              </div>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Timestamp & Gas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar size={12} /> Fecha / Hora
                </label>
                <input
                  type="datetime-local"
                  value={customTimestamp}
                  onChange={(e) => setCustomTimestamp(e.target.value)}
                  className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Fuel size={12} /> Tarifa de Red
                </label>
                <input
                  type="number"
                  step="any"
                  value={customGasFee}
                  onChange={(e) => setCustomGasFee(e.target.value)}
                  placeholder="0.0001"
                  className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Custom Note */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Nota / Concepto</label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Ej. Pago de arbitraje, depósito de exchange..."
                className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Push Notification Toggle */}
            <div className="flex items-center justify-between p-3 bg-[#141f33] border border-slate-700/80 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-blue-400" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Notificación Push en Tiempo Real
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Muestra un banner en el teléfono Android del usuario
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={triggerPush}
                onChange={(e) => setTriggerPush(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:opacity-95 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap size={18} />
                Emitir Transacción y Sincronizar en Vivo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
