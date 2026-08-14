import React, { useState } from 'react';
import { Plus, Check, X, Smartphone, ShieldCheck, Wallet, Copy } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface UserSelectorModalProps {
  onClose: () => void;
}

export const UserSelectorModal: React.FC<UserSelectorModalProps> = ({ onClose }) => {
  const { users, activeUserId, selectUser, createNewUser, currencySymbol, pushPushNotification } = useWallet();
  const [showCreateInput, setShowCreateInput] = useState<boolean>(false);
  const [newWalletName, setNewWalletName] = useState<string>('');

  const handleSelect = (id: string) => {
    selectUser(id);
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    const newId = createNewUser(newWalletName.trim());
    setNewWalletName('');
    setShowCreateInput(false);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in">
      <div className="w-full bg-[#0d1424] border-t border-slate-700 rounded-t-[32px] p-5 text-white max-h-[85%] flex flex-col space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-white">Tus Billeteras Multicadena</h3>
            <p className="text-[11px] text-slate-400">Selecciona o crea una cuenta</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Wallets List */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-64">
          {users.map((user) => {
            const isCurrent = user.id === activeUserId;
            const totalUSD = user.assets.reduce((sum, a) => sum + a.balance * a.usdPrice, 0);

            return (
              <div
                key={user.id}
                onClick={() => handleSelect(user.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isCurrent
                    ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-[#121b2d] border-slate-800 hover:bg-[#18243c]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Wallet size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">{user.name}</span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-semibold">
                          Activa
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block">
                      {user.address.substring(0, 6)}...{user.address.substring(38)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-xs text-white font-mono block">
                    {currencySymbol}{totalUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {user.assets.length} tokens
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create New Wallet */}
        {showCreateInput ? (
          <form onSubmit={handleCreate} className="space-y-2 pt-2 animate-in fade-in">
            <input
              type="text"
              placeholder="Nombre de la nueva billetera (ej. Trading DeFi)"
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              className="w-full bg-slate-900 border border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Crear ($0.00 USD)
              </button>
              <button
                type="button"
                onClick={() => setShowCreateInput(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-400 text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setShowCreateInput(true)}
              className="w-full py-3 bg-[#101726] hover:bg-[#182338] border border-dashed border-slate-700 rounded-2xl text-xs font-bold text-blue-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Crear Nueva Billetera Rápida ($0.00)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
