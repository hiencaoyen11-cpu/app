import React, { useState } from 'react';
import {
  X,
  Building2,
  Check,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Copy,
  Info,
  RefreshCw,
  Landmark,
} from 'lucide-react';
import { UserWallet, BankDepositDetails } from '../../types';
import { useWallet } from '../../context/WalletContext';
import { DEFAULT_BANK_DETAILS } from '../../data/initialData';

interface UserBankDetailsModalProps {
  user: UserWallet;
  onClose: () => void;
}

export const UserBankDetailsModal: React.FC<UserBankDetailsModalProps> = ({
  user,
  onClose,
}) => {
  const { updateUserBankDetails, pushPushNotification } = useWallet();

  const currentDetails: BankDepositDetails = {
    accountHolderName:
      user.bankDetails?.accountHolderName || DEFAULT_BANK_DETAILS.accountHolderName,
    iban: user.bankDetails?.iban || DEFAULT_BANK_DETAILS.iban,
    swiftBic: user.bankDetails?.swiftBic || DEFAULT_BANK_DETAILS.swiftBic,
    reference:
      user.bankDetails?.reference ||
      `TW-${user.id.replace('user_', '').toUpperCase()}-${Math.floor(
        Math.random() * 900 + 100
      )}`,
    bankName: user.bankDetails?.bankName || DEFAULT_BANK_DETAILS.bankName,
    country: user.bankDetails?.country || DEFAULT_BANK_DETAILS.country,
    notes: user.bankDetails?.notes || DEFAULT_BANK_DETAILS.notes,
  };

  const [formData, setFormData] = useState<BankDepositDetails>(currentDetails);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleChange = (field: keyof BankDepositDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateRandomRef = () => {
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newRef = `TW-${user.name.substring(0, 3).toUpperCase()}-${randomChars}`;
    setFormData((prev) => ({ ...prev, reference: newRef }));
    pushPushNotification('Nueva Referencia', `Referencia generada: ${newRef}`, 'info');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserBankDetails(user.id, formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e1626] border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-5 text-white shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Landmark size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Datos Bancarios de Depósito (Checkout)
              </h3>
              <p className="text-xs text-slate-400">
                Asignados para: <strong className="text-white">{user.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-slate-300 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
          💡 Estos datos son los que verá el usuario en su aplicación Trust Wallet al presionar el botón <strong>"Comprar"</strong> (en el mini checkout de 3 pasos) para realizar su transferencia bancaria.
        </p>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Nombre de cuentahabiente */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-1">
              Nombre de Cuentahabiente / Beneficiario *
            </label>
            <input
              type="text"
              required
              value={formData.accountHolderName}
              onChange={(e) => handleChange('accountHolderName', e.target.value)}
              placeholder="Ej. Trust Global Escrow Ltd"
              className="w-full bg-[#121c2d] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* IBAN */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-1">
              IBAN (Número de Cuenta Bancaria) *
            </label>
            <input
              type="text"
              required
              value={formData.iban}
              onChange={(e) => handleChange('iban', e.target.value)}
              placeholder="Ej. ES91 2100 0418 4502 0005 1234"
              className="w-full bg-[#121c2d] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* SWIFT / BIC */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-1">
                SWIFT / BIC *
              </label>
              <input
                type="text"
                required
                value={formData.swiftBic}
                onChange={(e) => handleChange('swiftBic', e.target.value)}
                placeholder="Ej. CAIXESBBXXX"
                className="w-full bg-[#121c2d] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Referencia */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                  Referencia *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomRef}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <RefreshCw size={10} /> Auto
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.reference}
                onChange={(e) => handleChange('reference', e.target.value)}
                placeholder="Ej. TW-DEP-8849"
                className="w-full bg-[#121c2d] border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400 font-bold"
              />
            </div>
          </div>

          {/* Banco & País */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-1">
                Nombre de la Entidad Bancaria
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="Ej. CaixaBank S.A."
                className="w-full bg-[#121c2d] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-1">
                País o Jurisdicción
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Ej. España / SEPA"
                className="w-full bg-[#121c2d] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notas / Instrucciones */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-1">
              Notas o Instrucciones para el Usuario
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Instrucciones adicionales que aparecerán en la pantalla del checkout..."
              className="w-full bg-[#121c2d] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isSaved ? <Check size={14} className="text-emerald-400" /> : <ShieldCheck size={14} />}
              <span>{isSaved ? '¡Guardado con Éxito!' : 'Asignar Datos al Usuario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
