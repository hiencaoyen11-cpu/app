import React, { useState } from 'react';
import {
  Users,
  Smartphone,
  ShieldCheck,
  Globe,
  Plus,
  ArrowRight,
  Wallet,
  KeyRound,
  CheckCircle2,
  Copy,
  Check,
  Key,
  Edit3,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Landmark,
} from 'lucide-react';
import { UserWallet } from '../../types';
import { useWallet } from '../../context/WalletContext';
import { generate12WordMnemonic, parseRecoveryPhrase } from '../../utils/bip39';
import { UserBankDetailsModal } from './UserBankDetailsModal';

interface UserManagementProps {
  onOpenNewUserModal: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onOpenNewUserModal }) => {
  const { users, activeUserId, crmSelectedUserId, selectCrmUser, selectUser, updateSeedPhrase, pushPushNotification } = useWallet();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  // Seed phrase modal state
  const [selectedUserForSeed, setSelectedUserForSeed] = useState<UserWallet | null>(null);
  const [selectedUserForBank, setSelectedUserForBank] = useState<UserWallet | null>(null);
  const [isEditingSeed, setIsEditingSeed] = useState<boolean>(false);
  const [seedInputText, setSeedInputText] = useState<string>('');
  const [seedError, setSeedError] = useState<string>('');
  const [copiedSeed, setCopiedSeed] = useState<boolean>(false);
  const [revealedSeeds, setRevealedSeeds] = useState<Record<string, boolean>>({});

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    pushPushNotification('Copiado', 'Dirección copiada al portapapeles', 'info');
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleOpenSeedModal = (user: UserWallet) => {
    setSelectedUserForSeed(user);
    setSeedInputText(user.recoveryPhrase.join(' '));
    setIsEditingSeed(false);
    setSeedError('');
    setCopiedSeed(false);
  };

  const handleCopyFullSeed = (phrase: string[]) => {
    navigator.clipboard.writeText(phrase.join(' '));
    setCopiedSeed(true);
    pushPushNotification('Semilla Copiada', '12 palabras copiadas al portapapeles', 'info');
    setTimeout(() => setCopiedSeed(false), 2500);
  };

  const handleRegenerateSeed = () => {
    const newWords = generate12WordMnemonic();
    setSeedInputText(newWords.join(' '));
    if (selectedUserForSeed) {
      updateSeedPhrase(selectedUserForSeed.id, newWords);
      setSelectedUserForSeed({ ...selectedUserForSeed, recoveryPhrase: newWords });
      pushPushNotification('Nueva Semilla', '12 palabras BIP-39 regeneradas para la billetera', 'info');
    }
  };

  const handleSaveEditedSeed = () => {
    const words = parseRecoveryPhrase(seedInputText);
    if (words.length !== 12) {
      setSeedError(`La frase debe contener exactamente 12 palabras. (Palabras detectadas: ${words.length})`);
      return;
    }
    if (selectedUserForSeed) {
      updateSeedPhrase(selectedUserForSeed.id, words);
      setSelectedUserForSeed({ ...selectedUserForSeed, recoveryPhrase: words });
      setIsEditingSeed(false);
      setSeedError('');
      pushPushNotification('Guardado', 'Frase semilla actualizada con éxito en CRM', 'success');
    }
  };

  const toggleRevealSeed = (userId: string) => {
    setRevealedSeeds(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <div className="p-6 space-y-6 text-white overflow-y-auto max-h-[calc(100vh-200px)] no-scrollbar">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101726] border border-slate-700/80 rounded-3xl p-5">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            Gestión de Billeteras y Palabras Semilla (BIP-39)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Administra claves mnemónicas de 12 palabras, direcciones multicadena, PIN de seguridad y estado de sincronización.
          </p>
        </div>

        <button
          onClick={onOpenNewUserModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={14} /> Registrar Nueva Billetera ($0.00 USD)
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const isPhoneActive = user.id === activeUserId;
          const isCrmActive = user.id === crmSelectedUserId;
          const totalUSD = user.assets.reduce((sum, a) => sum + a.balance * a.usdPrice, 0);
          const isSeedRevealed = !!revealedSeeds[user.id];

          return (
            <div
              key={user.id}
              className={`bg-[#0e1626] border rounded-3xl p-5 space-y-4 transition-all flex flex-col justify-between ${
                isCrmActive
                  ? 'border-blue-500 shadow-xl shadow-blue-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                        isCrmActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Smartphone size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5 flex-wrap">
                        {user.name}
                        {isCrmActive && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 font-bold rounded">
                            EN CRM
                          </span>
                        )}
                        {isPhoneActive && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold rounded">
                            ACTIVA EN MÓVIL
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-slate-400">{user.deviceModel}</span>
                    </div>
                  </div>
                </div>

                {/* Balance Pill */}
                <div className="bg-[#141f33] border border-slate-800 rounded-2xl p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Balance Total:</span>
                  <span className={`font-mono font-bold text-sm ${totalUSD > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    ${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>

                {/* Seed Phrase Card Preview */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Key size={12} /> Frase Semilla (12 Palabras BIP-39):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleRevealSeed(user.id)}
                        className="text-amber-400/80 hover:text-amber-300 p-1 rounded hover:bg-amber-500/10 transition-colors"
                        title={isSeedRevealed ? 'Ocultar palabras' : 'Revelar palabras'}
                      >
                        {isSeedRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button
                        onClick={() => handleCopyFullSeed(user.recoveryPhrase)}
                        className="text-amber-400/80 hover:text-amber-300 p-1 rounded hover:bg-amber-500/10 transition-colors"
                        title="Copiar 12 palabras"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>

                  {isSeedRevealed ? (
                    <div className="grid grid-cols-3 gap-1 bg-[#090e18] p-2 rounded-xl border border-slate-800/80 text-[10px] font-mono text-slate-300">
                      {user.recoveryPhrase.map((w, idx) => (
                        <span key={idx} className="truncate">
                          <span className="text-slate-500 text-[9px]">{idx + 1}.</span> {w}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#090e18] p-2 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                      <span>•••••••• •••••••• •••••••• (12 palabras)</span>
                      <button
                        onClick={() => handleOpenSeedModal(user)}
                        className="text-[10px] text-amber-400 font-sans hover:underline font-semibold"
                      >
                        Gestionar
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleOpenSeedModal(user)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                    >
                      <Edit3 size={11} /> Ver / Editar Semilla en CRM
                    </button>
                  </div>
                </div>

                {/* Addresses List */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-1.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">EVM / ETH:</span>
                    <button
                      onClick={() => handleCopy(user.address)}
                      className="font-mono text-blue-300 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <span>{user.address.substring(0, 6)}...{user.address.substring(38)}</span>
                      {copiedAddress === user.address ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-1.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">BTC:</span>
                    <button
                      onClick={() => handleCopy(user.btcAddress)}
                      className="font-mono text-amber-300 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <span>{user.btcAddress.substring(0, 6)}...{user.btcAddress.substring(36)}</span>
                      {copiedAddress === user.btcAddress ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>

                {/* Bank Deposit / Checkout Settings Box */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <Landmark size={12} /> Datos Bancarios (Checkout Comprar):
                    </span>
                    <button
                      onClick={() => setSelectedUserForBank(user)}
                      className="text-[10px] text-blue-300 hover:text-white font-bold flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 px-2 py-0.5 rounded-lg border border-blue-500/30 transition-colors cursor-pointer"
                    >
                      <Edit3 size={11} /> Asignar / Editar
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 space-y-0.5 bg-[#090e18] p-2 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between truncate">
                      <span className="text-slate-500">Titular:</span>
                      <span className="truncate max-w-[170px] font-semibold text-slate-200">
                        {user.bankDetails?.accountHolderName || 'Trust Global Escrow Ltd'}
                      </span>
                    </div>
                    <div className="flex justify-between truncate">
                      <span className="text-slate-500">IBAN:</span>
                      <span className="text-blue-300 truncate max-w-[170px]">
                        {user.bankDetails?.iban || 'ES91 2100...'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Referencia:</span>
                      <span className="text-amber-300 font-bold">
                        {user.bankDetails?.reference || ('TW-' + user.id.replace('user_', '').toUpperCase())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata tags */}
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    <Globe size={10} /> {user.ipAddress}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    <KeyRound size={10} /> PIN: {user.pinCode}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Separate CRM management and Mobile simulator */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                {!isCrmActive && (
                  <button
                    onClick={() => selectCrmUser(user.id)}
                    className="w-full py-2 bg-[#141f33] hover:bg-blue-600/30 text-blue-300 hover:text-white font-bold text-xs rounded-xl border border-blue-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Seleccionar en Panel CRM</span>
                  </button>
                )}

                {isPhoneActive ? (
                  <div className="py-1.5 text-center text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 size={13} /> Activa en Teléfono Móvil
                  </div>
                ) : (
                  <button
                    onClick={() => selectUser(user.id)}
                    className="w-full py-2 bg-[#121c2c] hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Cargar en Pantalla Móvil</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* SEED PHRASE MANAGEMENT MODAL (CRM)                       */}
      {/* ======================================================== */}
      {selectedUserForSeed && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1626] border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-5 text-white shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Palabras Semilla (BIP-39)</h3>
                  <p className="text-xs text-slate-400">Billetera: {selectedUserForSeed.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForSeed(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {!isEditingSeed ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Las 12 palabras secretas de respaldo asociadas a esta billetera en Trust Wallet:
                </p>

                {/* 12 Words Grid in modal */}
                <div className="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  {selectedUserForSeed.recoveryPhrase.map((w, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700/60"
                    >
                      <span className="text-[10px] font-bold text-amber-400 w-4 text-right">
                        {idx + 1}.
                      </span>
                      <span className="text-xs font-mono font-medium text-white truncate">
                        {w}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyFullSeed(selectedUserForSeed.recoveryPhrase)}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedSeed ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                    <span>{copiedSeed ? '¡Copiado!' : 'Copiar 12 Palabras'}</span>
                  </button>

                  <button
                    onClick={() => setIsEditingSeed(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 size={14} /> Modificar
                  </button>

                  <button
                    onClick={handleRegenerateSeed}
                    title="Regenerar 12 palabras aleatorias BIP-39"
                    className="px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw size={14} /> Regenerar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Ingresa exactamente 12 palabras en minúsculas separadas por espacio para actualizar la frase de la billetera.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Editar Frase Mnemónica
                  </label>
                  <textarea
                    rows={4}
                    value={seedInputText}
                    onChange={(e) => {
                      setSeedInputText(e.target.value);
                      setSeedError('');
                    }}
                    placeholder="palabra1 palabra2 palabra3 ... palabra12"
                    className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-between items-center mt-1 text-[11px]">
                    <span className="text-slate-400 font-mono">
                      Palabras: {parseRecoveryPhrase(seedInputText).length} / 12
                    </span>
                    <button
                      onClick={handleRegenerateSeed}
                      className="text-amber-400 hover:underline"
                    >
                      Generar aleatorias
                    </button>
                  </div>
                </div>

                {seedError && (
                  <div className="text-xs text-rose-400 font-semibold px-1">
                    {seedError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingSeed(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEditedSeed}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    Guardar Frase Semilla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BANK DEPOSIT & CHECKOUT MODAL (CRM)                      */}
      {/* ======================================================== */}
      {selectedUserForBank && (
        <UserBankDetailsModal
          user={selectedUserForBank}
          onClose={() => setSelectedUserForBank(null)}
        />
      )}
    </div>
  );
};
