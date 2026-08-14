import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { Transaction } from '../../types';
import { useWallet } from '../../context/WalletContext';

interface TransactionHistoryProps {
  onSelectTx: (tx: Transaction) => void;
  filteredAssetSymbol?: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ onSelectTx, filteredAssetSymbol }) => {
  const { userTransactions, currencySymbol } = useWallet();
  const [filterType, setFilterType] = useState<'all' | 'receive' | 'send' | 'swap'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = userTransactions.filter((tx) => {
    if (filteredAssetSymbol && tx.assetSymbol.toUpperCase() !== filteredAssetSymbol.toUpperCase()) {
      return false;
    }
    if (filterType !== 'all') {
      if (filterType === 'receive' && tx.type !== 'receive' && tx.type !== 'reward') return false;
      if (filterType === 'send' && tx.type !== 'send') return false;
      if (filterType === 'swap' && tx.type !== 'swap') return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tx.assetSymbol.toLowerCase().includes(q) ||
        tx.txHash.toLowerCase().includes(q) ||
        tx.toAddress.toLowerCase().includes(q) ||
        (tx.note && tx.note.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#070b14] text-white">
      {/* Search and Filters */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por token, hash o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#101726] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'receive', label: 'Recibidos' },
            { id: 'send', label: 'Enviados' },
            { id: 'swap', label: 'Canjes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2">
        {filtered.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
            <Clock size={28} className="mb-2 opacity-40" />
            <p>No se encontraron transacciones</p>
            <span className="text-[10px] text-slate-600 mt-1">
              Las transacciones enviadas o generadas desde el CRM aparecerán aquí
            </span>
          </div>
        ) : (
          filtered.map((tx) => {
            const isReceive = tx.type === 'receive' || tx.type === 'reward';
            const isSwap = tx.type === 'swap';
            const isFailed = tx.status === 'failed';
            const isPending = tx.status === 'pending';

            return (
              <button
                key={tx.id}
                onClick={() => onSelectTx(tx)}
                className="w-full py-3 px-2 flex items-center justify-between hover:bg-[#101726]/80 rounded-xl transition-colors text-left"
              >
                {/* Left Icon & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isFailed
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : isPending
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : isReceive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : isSwap
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {isReceive ? (
                      <ArrowDownLeft size={18} />
                    ) : isSwap ? (
                      <ArrowLeftRight size={17} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">
                        {isReceive ? 'Recibido' : isSwap ? 'Canjeado' : 'Transferido'}
                      </span>
                      {isPending && (
                        <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded font-medium">
                          Pendiente
                        </span>
                      )}
                      {isFailed && (
                        <span className="text-[9px] px-1 bg-rose-500/20 text-rose-300 rounded font-medium">
                          Fallido
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                      {tx.note || (isReceive ? `De: ${tx.fromAddress.substring(0, 8)}...` : `Para: ${tx.toAddress.substring(0, 8)}...`)}
                    </div>
                  </div>
                </div>

                {/* Right Amount */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-bold font-mono ${
                      isFailed
                        ? 'text-slate-500 line-through'
                        : isReceive
                        ? 'text-emerald-400'
                        : 'text-white'
                    }`}
                  >
                    {isReceive ? '+' : '-'}{tx.amount} {tx.assetSymbol}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currencySymbol}{tx.usdValue.toFixed(2)}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
