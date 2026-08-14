import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Key,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Layers,
  Globe,
  ChevronRight,
  ClipboardPaste,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { generate12WordMnemonic, parseRecoveryPhrase } from '../../utils/bip39';

type Step = 'welcome' | 'backup_warning' | 'show_phrase' | 'verify_phrase' | 'set_pin' | 'import_phrase';

export const OnboardingScreen: React.FC = () => {
  const { createWalletFromOnboarding, importWalletFromPhrase, pushPushNotification } = useWallet();

  const [step, setStep] = useState<Step>('welcome');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(true);
  
  // Security checkboxes in backup_warning
  const [warn1, setWarn1] = useState(false);
  const [warn2, setWarn2] = useState(false);
  const [warn3, setWarn3] = useState(false);

  // New Wallet creation state
  const [generatedPhrase, setGeneratedPhrase] = useState<string[]>(() => generate12WordMnemonic());
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [walletName, setWalletName] = useState('Billetera Principal 1');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Import state
  const [importInput, setImportInput] = useState('');
  const [importName, setImportName] = useState('Billetera Importada');
  const [importError, setImportError] = useState('');
  const [showImportWords, setShowImportWords] = useState(true);

  // Carousel slide for welcome
  const [carouselIndex, setCarouselIndex] = useState(0);

  const slides = [
    {
      title: 'Tu portal confiable a la Web3',
      desc: 'Almacena, envía, recibe criptomonedas y explora aplicaciones DeFi con total soberanía y seguridad.',
      icon: <ShieldCheck className="w-16 h-16 text-[#0500FF]" />,
    },
    {
      title: 'Control total y privacidad absoluta',
      desc: 'Solo tú tienes acceso a tus claves privadas y frases de recuperación. Sin intermediarios ni custodia de terceros.',
      icon: <Key className="w-16 h-16 text-[#00D4FF]" />,
    },
    {
      title: 'Multicadena y más de 100 redes',
      desc: 'Soporte nativo para Bitcoin, Ethereum, BNB Smart Chain, Solana, Avalanche y Polygon.',
      icon: <Globe className="w-16 h-16 text-[#14F195]" />,
    },
  ];

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(generatedPhrase.join(' '));
    setCopiedPhrase(true);
    pushPushNotification('Copiado', 'Frase secreta copiada al portapapeles', 'info');
    setTimeout(() => setCopiedPhrase(false), 2500);
  };

  const handleRegeneratePhrase = () => {
    const newWords = generate12WordMnemonic();
    setGeneratedPhrase(newWords);
    pushPushNotification('Nueva Frase', '12 nuevas palabras BIP-39 generadas', 'info');
  };

  const handleCompleteCreation = () => {
    if (pin.length !== 6) {
      setPinError('El código PIN debe tener 6 dígitos');
      return;
    }
    if (pin !== confirmPin) {
      setPinError('Los códigos PIN no coinciden');
      return;
    }
    createWalletFromOnboarding(walletName, pin, generatedPhrase);
  };

  const handleImportSubmit = () => {
    const words = parseRecoveryPhrase(importInput);
    if (words.length !== 12) {
      setImportError(`Debes ingresar exactamente 12 palabras. (Palabras actuales: ${words.length})`);
      return;
    }
    importWalletFromPhrase(importName, words, '123456');
  };

  const handlePasteDemoSeed = () => {
    const demo = generate12WordMnemonic().join(' ');
    setImportInput(demo);
    setImportError('');
  };

  const wordsEnteredCount = parseRecoveryPhrase(importInput).length;

  return (
    <div id="onboarding_container" className="flex flex-col h-full bg-[#0A0E17] text-white select-none overflow-y-auto">
      <AnimatePresence mode="wait">
        {/* ======================================================== */}
        {/* WELCOME / SPLASH SCREEN                                  */}
        {/* ======================================================== */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col justify-between flex-1 p-6"
          >
            {/* Top Logo and Header */}
            <div className="flex flex-col items-center pt-8 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0500FF]/30 to-[#00D4FF]/30 flex items-center justify-center border border-[#0500FF]/40 shadow-[0_0_40px_rgba(5,0,255,0.3)]">
                  {slides[carouselIndex].icon}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#0500FF] p-1.5 rounded-full border-2 border-[#0A0E17]">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0500FF]/15 border border-[#0500FF]/30 text-xs font-semibold text-[#00D4FF] mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Trust Wallet Oficial v8.12</span>
              </div>

              <h1 className="text-2xl font-bold text-white tracking-tight leading-snug px-4">
                {slides[carouselIndex].title}
              </h1>
              <p className="text-sm text-slate-400 mt-2 px-6 leading-relaxed">
                {slides[carouselIndex].desc}
              </p>

              {/* Carousel Indicators */}
              <div className="flex items-center gap-2 mt-6">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      carouselIndex === i ? 'w-6 bg-[#0500FF]' : 'w-2 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-3 pt-6 pb-2">
              {/* Terms checkbox */}
              <label className="flex items-start gap-2.5 px-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={e => setAgreedTerms(e.target.checked)}
                  className="mt-1 rounded bg-slate-800 border-slate-700 text-[#0500FF] focus:ring-0 focus:outline-none cursor-pointer"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  He leído y acepto los{' '}
                  <span className="text-[#00D4FF] underline">Términos de Servicio</span> y la{' '}
                  <span className="text-[#00D4FF] underline">Política de Privacidad</span>.
                </span>
              </label>

              {/* Create new wallet button */}
              <button
                id="btn_create_new_wallet"
                disabled={!agreedTerms}
                onClick={() => setStep('backup_warning')}
                className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                  agreedTerms
                    ? 'bg-[#0500FF] hover:bg-[#0047e0] active:scale-[0.98] text-white shadow-[0_4px_20px_rgba(5,0,255,0.4)]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Crear una nueva billetera</span>
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Import existing wallet button */}
              <button
                id="btn_import_wallet"
                disabled={!agreedTerms}
                onClick={() => setStep('import_phrase')}
                className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border ${
                  agreedTerms
                    ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-[#00D4FF] active:scale-[0.98]'
                    : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Ya tengo una billetera (Importar)</span>
              </button>

              <div className="text-center text-[11px] text-slate-500 mt-1">
                Inicialización con saldo cero ($0.00 USD) • Balances gestionados vía CRM
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* BACKUP SECURITY WARNING                                 */}
        {/* ======================================================== */}
        {step === 'backup_warning' && (
          <motion.div
            key="backup_warning"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col justify-between flex-1 p-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setStep('welcome')}
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-white">Copia de seguridad</h2>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  En el siguiente paso verás las <strong>12 palabras secretas</strong> (BIP-39) que te permiten recuperar tu billetera si pierdes tu dispositivo.
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={warn1}
                    onChange={e => setWarn1(e.target.checked)}
                    className="mt-1 rounded bg-slate-800 border-slate-700 text-[#0500FF] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    Si pierdo mi frase secreta, mis fondos se perderán para siempre y nadie podrá recuperarlos.
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={warn2}
                    onChange={e => setWarn2(e.target.checked)}
                    className="mt-1 rounded bg-slate-800 border-slate-700 text-[#0500FF] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    Si comparto o expongo mi frase secreta, cualquier persona podrá robar mis criptomonedas.
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={warn3}
                    onChange={e => setWarn3(e.target.checked)}
                    className="mt-1 rounded bg-slate-800 border-slate-700 text-[#0500FF] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    El soporte de Trust Wallet <strong>NUNCA</strong> te pedirá tu frase secreta bajo ninguna circunstancia.
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-6">
              <button
                disabled={!(warn1 && warn2 && warn3)}
                onClick={() => setStep('show_phrase')}
                className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
                  warn1 && warn2 && warn3
                    ? 'bg-[#0500FF] hover:bg-[#0047e0] text-white shadow-[0_4px_20px_rgba(5,0,255,0.4)] active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Continuar
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* DISPLAY 12-WORD RECOVERY PHRASE                          */}
        {/* ======================================================== */}
        {step === 'show_phrase' && (
          <motion.div
            key="show_phrase"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col justify-between flex-1 p-6"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep('backup_warning')}
                    className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold text-white">Tu frase secreta</h2>
                </div>

                <button
                  onClick={handleRegeneratePhrase}
                  title="Generar otras palabras"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerar</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Escribe o copia estas 12 palabras en el orden exacto y guárdalas en un lugar seguro fuera de línea.
              </p>

              {/* 12 Words Grid */}
              <div className="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 mb-4">
                {generatedPhrase.map((word, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60"
                  >
                    <span className="text-[11px] font-semibold text-slate-400 w-4 text-right">
                      {idx + 1}.
                    </span>
                    <span className="text-xs font-mono font-medium text-white tracking-wide truncate">
                      {word}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action: Copy Phrase */}
              <button
                onClick={handleCopyPhrase}
                className="w-full py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-[#00D4FF] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {copiedPhrase ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPhrase ? '¡Frase copiada al portapapeles!' : 'Copiar las 12 palabras'}</span>
              </button>

              <div className="mt-4 p-3 rounded-xl bg-[#0500FF]/10 border border-[#0500FF]/30 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#00D4FF] shrink-0" />
                <span className="text-[11px] text-slate-300">
                  Esta frase también estará disponible y administrable en tu panel CRM.
                </span>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setStep('set_pin')}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-[#0500FF] hover:bg-[#0047e0] text-white shadow-[0_4px_20px_rgba(5,0,255,0.4)] active:scale-[0.98] transition-all"
              >
                Continuar y Establecer PIN
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SET 6-DIGIT PIN CODE                                     */}
        {/* ======================================================== */}
        {step === 'set_pin' && (
          <motion.div
            key="set_pin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col justify-between flex-1 p-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setStep('show_phrase')}
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-white">Código de acceso PIN</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    Nombre de la Billetera
                  </label>
                  <input
                    type="text"
                    value={walletName}
                    onChange={e => setWalletName(e.target.value)}
                    placeholder="Ej. Billetera Principal"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0500FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    Crear PIN de 6 dígitos
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={e => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setPinError('');
                    }}
                    placeholder="••••••"
                    className="w-full px-4 py-3 text-center tracking-[0.5em] text-lg font-mono rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#0500FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    Confirmar PIN de 6 dígitos
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPin}
                    onChange={e => {
                      setConfirmPin(e.target.value.replace(/\D/g, ''));
                      setPinError('');
                    }}
                    placeholder="••••••"
                    className="w-full px-4 py-3 text-center tracking-[0.5em] text-lg font-mono rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#0500FF]"
                  />
                </div>

                {pinError && (
                  <div className="text-xs text-red-400 font-medium px-1">
                    {pinError}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6">
              <button
                disabled={pin.length !== 6 || confirmPin.length !== 6}
                onClick={handleCompleteCreation}
                className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
                  pin.length === 6 && confirmPin.length === 6
                    ? 'bg-[#0500FF] hover:bg-[#0047e0] text-white shadow-[0_4px_20px_rgba(5,0,255,0.4)] active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Completar y Abrir Billetera
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* IMPORT EXISTING WALLET                                   */}
        {/* ======================================================== */}
        {step === 'import_phrase' && (
          <motion.div
            key="import_phrase"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col justify-between flex-1 p-6"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep('welcome')}
                    className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold text-white">Importar Billetera</h2>
                </div>

                <button
                  onClick={handlePasteDemoSeed}
                  className="text-xs text-[#00D4FF] hover:underline"
                >
                  Generar demo
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Ingresa tu frase secreta de recuperación de 12 palabras separadas por espacios.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    Nombre de la Billetera
                  </label>
                  <input
                    type="text"
                    value={importName}
                    onChange={e => setImportName(e.target.value)}
                    placeholder="Ej. Billetera Importada"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0500FF]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-400 font-medium">
                      Frase Secreta (12 palabras)
                    </label>
                    <span className={`text-xs font-mono ${wordsEnteredCount === 12 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {wordsEnteredCount} / 12 palabras
                    </span>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={4}
                      value={importInput}
                      onChange={e => {
                        setImportInput(e.target.value);
                        setImportError('');
                      }}
                      placeholder="ejemplo: abandon amount liar fortune bracket clog crystal matrix orbital quantum shield vortex"
                      className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#0500FF] resize-none"
                    />
                  </div>
                </div>

                {importError && (
                  <div className="text-xs text-red-400 font-medium px-1">
                    {importError}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6">
              <button
                disabled={wordsEnteredCount !== 12}
                onClick={handleImportSubmit}
                className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
                  wordsEnteredCount === 12
                    ? 'bg-[#0500FF] hover:bg-[#0047e0] text-white shadow-[0_4px_20px_rgba(5,0,255,0.4)] active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Importar Billetera ($0.00 USD)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
