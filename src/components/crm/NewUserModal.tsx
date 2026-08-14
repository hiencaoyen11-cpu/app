import React, { useState } from 'react';
import { X, Smartphone, Plus, Sparkles, Key, Globe, Shield, RefreshCw } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { generate12WordMnemonic, parseRecoveryPhrase } from '../../utils/bip39';

interface NewUserModalProps {
  onClose: () => void;
}

export const NewUserModal: React.FC<NewUserModalProps> = ({ onClose }) => {
  const { createNewUser, pushPushNotification } = useWallet();
  const [userName, setUserName] = useState<string>('');
  const [customAddress, setCustomAddress] = useState<string>('');
  const [deviceType, setDeviceType] = useState<string>('Samsung Galaxy S24 Ultra');
  const [seedPhrase, setSeedPhrase] = useState<string>(() => generate12WordMnemonic().join(' '));
  const [seedError, setSeedError] = useState<string>('');

  const handleRegenerateSeed = () => {
    const words = generate12WordMnemonic();
    setSeedPhrase(words.join(' '));
    setSeedError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    const words = parseRecoveryPhrase(seedPhrase);
    if (words.length !== 12) {
      setSeedError(`La frase semilla debe tener exactamente 12 palabras. (Actuales: ${words.length})`);
      return;
    }

    createNewUser(userName.trim(), customAddress.trim() || undefined, words);
    pushPushNotification('Billetera Creada', `${userName.trim()} creada con saldo $0.00 USD`, 'success');
    onClose();
  };

  const handleGenerateRandomEVM = () => {
    setCustomAddress('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
  };

  const wordsCount = parseRecoveryPhrase(seedPhrase).length;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0e1626] border border-slate-700 rounded-3xl p-6 text-white space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Registrar Nueva Billetera en CRM</h3>
              <p className="text-[11px] text-slate-400">Inicialización con saldo $0.00 (ajustable desde CRM)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Nombre de la Billetera / Usuario</label>
            <input
              type="text"
              placeholder="Ej. Billetera Inversor VIP #4"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              required
              autoFocus
            />
          </div>

          {/* Seed Phrase BIP-39 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Key size={13} /> Palabras Semilla (12 Palabras BIP-39)
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono ${wordsCount === 12 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {wordsCount}/12 palabras
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateSeed}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] hover:underline"
                >
                  <RefreshCw size={11} /> Regenerar
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              value={seedPhrase}
              onChange={(e) => {
                setSeedPhrase(e.target.value);
                setSeedError('');
              }}
              placeholder="12 palabras separadas por espacios..."
              className="w-full bg-[#141f33] border border-slate-700 rounded-2xl p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-500 resize-none"
            />
            {seedError && (
              <p className="text-rose-400 text-[11px] font-semibold">{seedError}</p>
            )}
          </div>

          {/* Custom Address */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300 font-semibold">
              <span>Dirección EVM (Opcional - Derivada por defecto)</span>
              <button
                type="button"
                onClick={handleGenerateRandomEVM}
                className="text-blue-400 text-[11px] hover:underline"
              >
                Generar aleatoria
              </button>
            </div>
            <input
              type="text"
              placeholder="0x... (dejar en blanco para derivar automáticamente)"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Device Model Simulator */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Modelo de Dispositivo Android Simulado</label>
            <select
              aria-label="Modelo de Dispositivo Android Simulado"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full bg-[#141f33] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            >
              <option value="Samsung Galaxy S24 Ultra">Samsung Galaxy S24 Ultra (Android 14)</option>
              <option value="Google Pixel 8 Pro">Google Pixel 8 Pro (Android 14)</option>
              <option value="Xiaomi 14 Pro">Xiaomi 14 Pro (HyperOS / Android 14)</option>
              <option value="OnePlus 12">OnePlus 12 (OxygenOS)</option>
            </select>
          </div>

          {/* Initial seed phrase info notice */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3 text-[11px] text-emerald-200/90 flex items-start gap-2">
            <Shield size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <p>
              La billetera se inicializará con saldo cero ($0.00 USD). Podrás inyectar o modificar cualquier token en cualquier momento desde la pestaña <strong>Control de Balances</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={wordsCount !== 12}
              className={`flex-1 py-3 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                wordsCount === 12
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles size={14} />
              Crear Billetera ($0.00 USD)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
