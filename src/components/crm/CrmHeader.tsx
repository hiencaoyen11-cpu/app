import React from 'react';
import {
  Server,
  Activity,
  Users,
  ShieldCheck,
  RefreshCw,
  Plus,
  Zap,
  Globe,
  Radio,
  Smartphone,
  QrCode
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface CrmHeaderProps {
  onOpenNewUserModal: () => void;
  onOpenApkModal?: () => void;
  activeCrmTab: 'balances' | 'generator' | 'users' | 'audit' | 'sessions';
  onChangeCrmTab: (tab: 'balances' | 'generator' | 'users' | 'audit' | 'sessions') => void;
}

export const CrmHeader: React.FC<CrmHeaderProps> = ({
  onOpenNewUserModal,
  onOpenApkModal,
  activeCrmTab,
  onChangeCrmTab,
}) => {
  const {
    users,
    activeUserId,
    selectUser,
    currentUser,
    currencySymbol,
    auditLogs,
    resetAllData,
  } = useWallet();

  const totalManagedUSD = users.reduce((acc, u) => {
    return acc + u.assets.reduce((sum, a) => sum + a.balance * a.usdPrice, 0);
  }, 0);

  const tabs = [
    { id: 'balances', label: 'Modificador de Balances' },
    { id: 'generator', label: 'Generador de Transacciones' },
    { id: 'users', label: 'Gestor de Usuarios & Semillas' },
    { id: 'audit', label: `Auditoría y Logs (${auditLogs.length})` },
  ] as const;

  return (
    <div className="bg-[#0b1220] border-b border-slate-800 p-4 text-white space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Server size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Trust Wallet CRM
                <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 text-blue-400 font-bold rounded-full uppercase tracking-wider">
                  FreeAccess v3.0
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Radio size={12} className="animate-pulse" /> Firebase Cloud Live Sync Activo
              </span>
              <span>•</span>
              <span className="text-slate-400">{users.length} Billeteras Gestionadas</span>
            </p>
          </div>
        </div>

        {/* Global stats pills & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* APK / Mobile Testing Link */}
          {onOpenApkModal && (
            <button
              onClick={onOpenApkModal}
              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-bold text-xs rounded-2xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Smartphone size={14} />
              <span>Probar en Android (APK / QR)</span>
            </button>
          )}

          {/* Managed Capital Card */}
          <div className="bg-[#111a2e] border border-slate-700/80 rounded-2xl px-3.5 py-1.5 flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Capital Total CRM</span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              ${totalManagedUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
            </span>
          </div>

          {/* User selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#111a2e] border border-slate-700/80 rounded-2xl px-3 py-1.5">
            <Users size={14} className="text-blue-400 shrink-0" />
            <select
              aria-label="Seleccionar Usuario Administrado"
              value={activeUserId}
              onChange={(e) => selectUser(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0b1220] text-white">
                  {u.name} ({u.address.substring(0, 6)}...)
                </option>
              ))}
            </select>
          </div>

          {/* New User Button */}
          <button
            onClick={onOpenNewUserModal}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={14} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-3">
        {tabs.map((tab) => {
          const isActive = activeCrmTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeCrmTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-[#111a2e] text-slate-400 hover:text-white hover:bg-[#16233e]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
