import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, XCircle, Copy, ExternalLink, ShieldCheck, Check } from 'lucide-react';
import { Transaction } from '../../types';
import { useWallet } from '../../context/WalletContext';

interface TransactionDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, onClose }) => {
  const { currencySymbol, pushPushNotification } = useWallet();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    pushPushNotification('Copiado', `${label} copiado al portapapeles`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isReceive = transaction.type === 'receive' || transaction.type === 'reward';
  const isPending = transaction.status === 'pending';
  const isFailed = transaction.status === 'failed';

  return (
    <div className="absolute inset-0 bg-[#070b14] z-50 flex flex-col text-white animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-300"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="font-bold text-sm tracking-wide">Detalle de Transacción</span>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
        <div className="space-y-4">
          {/* Main Status Badge & Big Amount */}
          <div className="text-center py-5 bg-[#101726] border border-slate-800 rounded-3xl space-y-2">
            <div className="flex justify-center">
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  isFailed
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : isPending
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isFailed ? (
                  <XCircle size={14} />
                ) : isPending ? (
                  <Clock size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span className="capitalize">{transaction.status}</span>
              </div>
            </div>

            <div
              className={`text-3xl font-black ${
                isFailed
                  ? 'text-slate-400 line-through'
                  : isReceive
                  ? 'text-emerald-400'
                  : 'text-white'
              }`}
            >
              {isReceive ? '+' : '-'}{transaction.amount} {transaction.assetSymbol}
            </div>

            <p className="text-xs text-slate-400">
              ≈ {currencySymbol}{transaction.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-[#101726] border border-slate-800 rounded-2xl p-4 space-y-3.5 text-xs">
            {/* Timestamp */}
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Fecha y Hora</span>
              <span className="font-medium text-slate-200">
                {new Date(transaction.timestamp).toLocaleString()}
              </span>
            </div>

            {/* From Address */}
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">De (Remitente)</span>
              <button
                onClick={() => handleCopy(transaction.fromAddress, 'Dirección Remitente')}
                className="font-mono text-slate-200 hover:text-blue-400 flex items-center gap-1 max-w-[170px] truncate"
              >
                <span className="truncate">{transaction.fromAddress}</span>
                {copiedKey === 'Dirección Remitente' ? <Check size={12} className="text-emerald-400 shrink-0" /> : <Copy size={12} className="shrink-0 opacity-60" />}
              </button>
            </div>

            {/* To Address */}
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Para (Destinatario)</span>
              <button
                onClick={() => handleCopy(transaction.toAddress, 'Dirección Destinatario')}
                className="font-mono text-blue-300 hover:text-blue-400 flex items-center gap-1 max-w-[170px] truncate"
              >
                <span className="truncate">{transaction.toAddress}</span>
                {copiedKey === 'Dirección Destinatario' ? <Check size={12} className="text-emerald-400 shrink-0" /> : <Copy size={12} className="shrink-0 opacity-60" />}
              </button>
            </div>

            {/* Network */}
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Red Blockchain</span>
              <span className="font-bold text-slate-200 uppercase">
                {transaction.network}
              </span>
            </div>

            {/* Network Fee */}
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Tarifa de Red</span>
              <span className="font-mono text-slate-200">
                {transaction.networkFee} {transaction.networkFeeAsset}
              </span>
            </div>

            {/* Block Height */}
            {transaction.blockNumber && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Bloque</span>
                <span className="font-mono text-slate-300">
                  #{transaction.blockNumber.toLocaleString()}
                </span>
              </div>
            )}

            {/* Note / Memo */}
            {transaction.note && (
              <div className="py-1">
                <span className="text-slate-400 block mb-1">Nota / Memo</span>
                <p className="text-slate-300 bg-slate-900/80 rounded-xl p-2.5 text-[11px] leading-relaxed border border-slate-800">
                  {transaction.note}
                </p>
              </div>
            )}
          </div>

          {/* Tx Hash Box */}
          <div className="bg-[#101726] border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Hash de Transacción (TxID)</span>
              <button
                onClick={() => handleCopy(transaction.txHash, 'Tx Hash')}
                className="text-blue-400 text-[11px] hover:underline flex items-center gap-1 font-bold"
              >
                {copiedKey === 'Tx Hash' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />} Copiar
              </button>
            </div>
            <p className="font-mono text-[11px] text-slate-400 break-all bg-slate-900/90 rounded-xl p-2 select-all border border-slate-800">
              {transaction.txHash}
            </p>
          </div>
        </div>

        {/* View on Explorer button */}
        <div className="pt-2">
          <a
            href={`https://etherscan.io/tx/${transaction.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-[#121c2e] hover:bg-[#18263e] text-blue-400 font-bold text-xs rounded-2xl border border-blue-500/30 flex items-center justify-center gap-2 transition-all"
          >
            <ExternalLink size={14} />
            Ver en Explorador Blockchain
          </a>
        </div>
      </div>
    </div>
  );
};
