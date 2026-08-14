import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, KeyRound, Copy, Check, Eye, EyeOff, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface SecurityScreenProps {
  onUnlockSuccess?: () => void;
  mode?: 'lock' | 'phrase_view';
  onClose?: () => void;
}

export const SecurityScreen: React.FC<SecurityScreenProps> = ({
  onUnlockSuccess,
  mode = 'lock',
  onClose,
}) => {
  const {
    currentUser,
    unlockWithPin,
    unlockWithBiometrics,
    isBiometricsActive,
    pushPushNotification,
  } = useWallet();

  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedPhrase, setCopiedPhrase] = useState<boolean>(false);
  const [revealPhrase, setRevealPhrase] = useState<boolean>(false);

  const handleKeyPress = (digit: string) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMsg('');

      if (nextPin.length === 6) {
        setTimeout(() => {
          const success = unlockWithPin(nextPin);
          if (success) {
            pushPushNotification('Desbloqueo Exitoso', 'Billetera desbloqueada correctamente', 'success');
            if (onUnlockSuccess) onUnlockSuccess();
          } else {
            setErrorMsg('Código PIN incorrecto');
            setPinInput('');
          }
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleBiometricAuth = () => {
    unlockWithBiometrics();
    pushPushNotification('Autenticación Biométrica', 'Huella dactilar reconocida con éxito', 'success');
    if (onUnlockSuccess) onUnlockSuccess();
  };

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(currentUser.recoveryPhrase.join(' '));
    setCopiedPhrase(true);
    pushPushNotification('Frase Copiada', '12 palabras copiadas al portapapeles con seguridad', 'info');
    setTimeout(() => setCopiedPhrase(false), 2000);
  };

  if (mode === 'phrase_view') {
    return (
      <div className="absolute inset-0 bg-[#070b14] z-50 flex flex-col text-white animate-in fade-in duration-200">
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700 flex items-center justify-center text-slate-300"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <span className="font-bold text-sm tracking-wide">Frase de Recuperación</span>
          <div className="w-9" />
        </div>

        <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 leading-relaxed">
                <strong>Advertencia de Seguridad:</strong> Tu frase de recuperación de 12 palabras es la única forma de restaurar tus fondos. No la compartas nunca.
              </p>
            </div>

            {/* 12-Word Grid */}
            <div className="bg-[#101726] border border-slate-800 rounded-3xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">12 Palabras Secretas</span>
                <button
                  onClick={() => setRevealPhrase(!revealPhrase)}
                  className="text-blue-400 flex items-center gap-1 text-[11px] font-semibold"
                >
                  {revealPhrase ? <EyeOff size={13} /> : <Eye size={13} />}
                  {revealPhrase ? 'Ocultar' : 'Revelar'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {currentUser.recoveryPhrase.map((word, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 flex items-center gap-1.5 text-xs font-mono"
                  >
                    <span className="text-[10px] text-slate-500 font-bold w-4 text-right">
                      {idx + 1}.
                    </span>
                    <span className="font-semibold text-slate-200">
                      {revealPhrase ? word : '••••••'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleCopyPhrase}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {copiedPhrase ? <Check size={16} /> : <Copy size={16} />}
              {copiedPhrase ? '¡Copiado con Éxito!' : 'Copiar Frase Secreta'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-2xl transition-colors"
              >
                Cerrar y Regresar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#070b14] z-50 flex flex-col items-center justify-between p-6 text-white animate-in fade-in">
      {/* Top Header info */}
      <div className="flex flex-col items-center gap-2 pt-6 text-center">
        <div className="w-14 h-14 rounded-3xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-xl">
          <Lock size={26} />
        </div>
        <h3 className="text-lg font-bold text-white mt-2">Introduce tu Código PIN</h3>
        <p className="text-xs text-slate-400 max-w-[220px]">
          Protección de seguridad biométrica y cifrado local de Trust Wallet
        </p>
      </div>

      {/* PIN Dots */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pinInput.length > idx
                  ? 'bg-blue-500 scale-110 shadow-md shadow-blue-500/50'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>
        {errorMsg ? (
          <span className="text-xs text-rose-400 font-semibold animate-shake">
            {errorMsg}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono">
            PIN por defecto: 123456
          </span>
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-3.5 pb-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleKeyPress(digit)}
            className="w-16 h-16 rounded-full bg-[#101726] hover:bg-[#182338] active:scale-90 transition-all font-bold text-xl text-white flex items-center justify-center shadow-md border border-slate-800/80 mx-auto"
          >
            {digit}
          </button>
        ))}

        {/* Biometric Button */}
        <button
          onClick={handleBiometricAuth}
          className="w-16 h-16 rounded-full bg-blue-950/40 hover:bg-blue-900/60 active:scale-90 transition-all text-blue-400 flex items-center justify-center shadow-md border border-blue-700/40 mx-auto"
          title="Desbloquear con Biometría"
        >
          <Fingerprint size={28} />
        </button>

        {/* 0 */}
        <button
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 rounded-full bg-[#101726] hover:bg-[#182338] active:scale-90 transition-all font-bold text-xl text-white flex items-center justify-center shadow-md border border-slate-800/80 mx-auto"
        >
          0
        </button>

        {/* Backspace */}
        <button
          onClick={handleBackspace}
          className="w-16 h-16 rounded-full bg-[#101726] hover:bg-[#182338] active:scale-90 transition-all text-slate-400 hover:text-white flex items-center justify-center shadow-md border border-slate-800/80 mx-auto text-xs font-semibold"
        >
          Borrar
        </button>
      </div>
    </div>
  );
};
