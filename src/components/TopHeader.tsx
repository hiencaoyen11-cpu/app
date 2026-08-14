import React from 'react';
import {
  Smartphone,
  LayoutGrid,
  Monitor,
  Columns,
  RotateCcw,
  Sparkles,
  Shield,
  Bell,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export type ViewMode = 'dual' | 'mobile' | 'crm';

interface TopHeaderProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenApkModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ viewMode, onChangeViewMode, onOpenApkModal }) => {
  const { pushPushNotification, resetAllData, currentUser } = useWallet();

  const handleQuickDemoAlert = () => {
    pushPushNotification(
      'Depósito Recibido',
      `+0.50 BTC ($47,410.25 USD) recibido en ${currentUser.name}`,
      'success'
    );
  };

  return (
    <header className="h-16 bg-[#090d18] border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between text-white shrink-0 z-30">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0052FF] flex items-center justify-center text-white shadow-md shadow-blue-600/30">
          <Shield size={20} className="fill-white/20" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm md:text-base tracking-tight text-white">
              Trust Wallet
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-bold">
              Android Edition & Remote CRM
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Entorno de pruebas y control remoto en tiempo real
          </p>
        </div>
      </div>

      {/* View Mode Switcher (Desktop & Mobile) */}
      <div className="flex items-center gap-2 bg-[#111728] border border-slate-700/80 rounded-2xl p-1 shadow-inner">
        <button
          onClick={() => onChangeViewMode('dual')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'dual'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Vista Dual: Teléfono Android + Panel CRM"
        >
          <Columns size={14} />
          <span className="hidden md:inline">Vista Dual (Teléfono + CRM)</span>
          <span className="md:hidden">Dual</span>
        </button>

        <button
          onClick={() => onChangeViewMode('mobile')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'mobile'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Sólo Teléfono Android"
        >
          <Smartphone size={14} />
          <span className="hidden md:inline">Sólo App Android</span>
          <span className="md:hidden">Móvil</span>
        </button>

        <button
          onClick={() => onChangeViewMode('crm')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'crm'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Sólo Panel Web CRM"
        >
          <Monitor size={14} />
          <span className="hidden md:inline">Panel Web CRM</span>
          <span className="md:hidden">CRM</span>
        </button>
      </div>

      {/* Action Tools */}
      <div className="flex items-center gap-2">
        {/* Android APK button */}
        <button
          onClick={onOpenApkModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#0500FF] to-[#00D4FF] hover:brightness-110 text-white text-xs font-extrabold rounded-xl shadow-md shadow-[#0500FF]/30 transition-all active:scale-95 cursor-pointer"
          title="Abrir e instalar en tu celular Android"
        >
          <Smartphone size={14} />
          <span className="hidden sm:inline">Probar en Android (APK / QR)</span>
          <span className="sm:hidden">Android</span>
        </button>

        <button
          onClick={handleQuickDemoAlert}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#141d30] hover:bg-[#1a2640] border border-slate-700 text-xs font-semibold text-blue-300 rounded-xl transition-all cursor-pointer"
        >
          <Bell size={13} />
          Test Push
        </button>

        <button
          onClick={resetAllData}
          className="px-3 py-1.5 bg-[#141d30] hover:bg-rose-900/30 border border-slate-700 hover:border-rose-700/50 text-xs font-semibold text-slate-300 hover:text-rose-300 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          title="Restablecer datos de fábrica"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Restablecer</span>
        </button>
      </div>
    </header>
  );
};
