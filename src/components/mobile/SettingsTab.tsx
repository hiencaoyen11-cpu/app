import React, { useState } from 'react';
import {
  Shield,
  Key,
  Fingerprint,
  DollarSign,
  Globe,
  Bell,
  Link2,
  HelpCircle,
  ChevronRight,
  Info,
  Smartphone,
  Lock,
  RotateCcw,
  Check
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface SettingsTabProps {
  onOpenRecoveryPhrase: () => void;
  onOpenUserModal: () => void;
  onOpenPinLockTest: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onOpenRecoveryPhrase,
  onOpenUserModal,
  onOpenPinLockTest,
}) => {
  const {
    currentUser,
    users,
    currency,
    setCurrency,
    isBiometricsActive,
    toggleBiometrics,
    activeDAppSessions,
    disconnectDApp,
    pushPushNotification,
    lockWallet,
    restartOnboarding,
  } = useWallet();

  const [pushNotifsEnabled, setPushNotifsEnabled] = useState<boolean>(true);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState<boolean>(false);

  const handleTogglePush = () => {
    setPushNotifsEnabled(!pushNotifsEnabled);
    pushPushNotification(
      'Notificaciones',
      !pushNotifsEnabled ? 'Notificaciones push activadas' : 'Notificaciones desactivadas',
      'info'
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#050811] text-white overflow-y-auto no-scrollbar p-4 space-y-4">
      {/* Header */}
      <div className="pt-2 pb-1">
        <h3 className="text-base font-bold text-white">Ajustes y Configuración</h3>
        <p className="text-xs text-slate-400">Preferencias de la billetera e identidad</p>
      </div>

      {/* SECTION: WALLETS */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-3xl p-3.5 space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Cuentas y Billeteras
        </span>
        <button
          onClick={onOpenUserModal}
          className="w-full flex items-center justify-between p-2 hover:bg-[#142036] rounded-2xl transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                {currentUser.name}
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded font-semibold">
                  Activa
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {currentUser.address.substring(0, 8)}...{currentUser.address.substring(36)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <span>{users.length} billeteras</span>
            <ChevronRight size={16} />
          </div>
        </button>

        {/* Re-trigger onboarding screen */}
        <button
          onClick={restartOnboarding}
          className="w-full flex items-center justify-between p-2 hover:bg-[#142036] rounded-2xl transition-colors text-left border-t border-slate-800/60 pt-2.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <RotateCcw size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Pantalla Inicial de Bienvenida</span>
              <span className="text-[10px] text-slate-400">Crear nueva billetera o importar</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500" />
        </button>
      </div>

      {/* SECTION: SECURITY */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-3xl p-3.5 space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Seguridad y Respaldo
        </span>

        {/* Secret Phrase */}
        <button
          onClick={onOpenRecoveryPhrase}
          className="w-full flex items-center justify-between p-2 hover:bg-[#142036] rounded-2xl transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Key size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Frase Secreta de Respaldo</span>
              <span className="text-[10px] text-slate-400">Ver las 12 palabras de recuperación</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500" />
        </button>

        {/* Biometrics Toggle */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Fingerprint size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Bloqueo Biométrico / Huella</span>
              <span className="text-[10px] text-slate-400">Requerir huella o PIN para transacciones</span>
            </div>
          </div>
          <button
            onClick={toggleBiometrics}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              isBiometricsActive ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isBiometricsActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Lock Now Button */}
        <button
          onClick={() => {
            lockWallet();
            onOpenPinLockTest();
          }}
          className="w-full flex items-center justify-between p-2 hover:bg-[#142036] rounded-2xl transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Bloquear Billetera Ahora</span>
              <span className="text-[10px] text-slate-400">Probar pantalla de desbloqueo PIN</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500" />
        </button>
      </div>

      {/* SECTION: PREFERENCES & WEB3 */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-3xl p-3.5 space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Preferencias del Sistema
        </span>

        {/* Currency Picker */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <DollarSign size={18} />
              </div>
              <span className="text-xs font-bold text-white">Moneda Principal</span>
            </div>
            <div className="flex items-center gap-1">
              {(['USD', 'EUR', 'GBP'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    currency === c
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Push notifications */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <span className="text-xs font-bold text-white">Alertas Push Instantáneas</span>
          </div>
          <button
            onClick={handleTogglePush}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              pushNotifsEnabled ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                pushNotifsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* WalletConnect Sessions */}
        <div className="p-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Link2 size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Conexiones WalletConnect</span>
                <span className="text-[10px] text-slate-400">
                  {activeDAppSessions.length} sesiones activas
                </span>
              </div>
            </div>
          </div>

          {activeDAppSessions.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {activeDAppSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-200">{session.dappName}</span>
                  <button
                    onClick={() => disconnectDApp(session.id)}
                    className="text-rose-400 text-[11px] font-bold hover:underline"
                  >
                    Desconectar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* App Version Info */}
      <div className="text-center py-2 text-slate-500 text-[11px] space-y-1">
        <p className="font-semibold text-slate-400">Trust Wallet v11.4 (Build 8940)</p>
        <p>Motor de sincronización con FreeAccess CRM activo</p>
      </div>
    </div>
  );
};
