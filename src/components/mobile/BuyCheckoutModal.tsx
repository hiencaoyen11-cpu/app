import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Share2,
  Banknote,
  Coins,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { CryptoAsset } from '../../types';
import { DEFAULT_BANK_DETAILS, INITIAL_ASSETS } from '../../data/initialData';

interface BuyCheckoutModalProps {
  onClose: () => void;
  initialAsset?: CryptoAsset;
}

type CheckoutStep = 'amount' | 'target_currency' | 'bank_details' | 'success';
type TargetCategory = 'crypto' | 'fiat';

interface FiatTargetOption {
  symbol: string;
  name: string;
  sign: string;
  flag: string;
  usdRate: number; // 1 unit in USD
}

const FIAT_TARGETS: FiatTargetOption[] = [
  { symbol: 'EUR', name: 'Euro (€)', sign: '€', flag: '🇪🇺', usdRate: 1.08 },
  { symbol: 'USD', name: 'Dólar Estadounidense ($)', sign: '$', flag: '🇺🇸', usdRate: 1.00 },
  { symbol: 'GBP', name: 'Libra Esterlina (£)', sign: '£', flag: '🇬🇧', usdRate: 1.28 },
];

export const BuyCheckoutModal: React.FC<BuyCheckoutModalProps> = ({
  onClose,
  initialAsset,
}) => {
  const {
    currentUser,
    currencySymbol,
    createCustomTransaction,
    pushPushNotification,
  } = useWallet();

  const [step, setStep] = useState<CheckoutStep>('amount');

  // =========================================================================
  // PASO 1: MONTO A DEPOSITAR Y DIVISA DE PAGO
  // =========================================================================
  const [fiatCurrency, setFiatCurrency] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [amountError, setAmountError] = useState<string>('');

  // =========================================================================
  // PASO 2: MONEDA A ACREDITAR (FIAT O CRYPTO)
  // =========================================================================
  const [targetCategory, setTargetCategory] = useState<TargetCategory>('crypto');
  
  // Safe assets fallback
  const userAssets = currentUser?.assets?.length ? currentUser.assets : INITIAL_ASSETS;

  // Selected crypto option
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset>(() => {
    if (initialAsset) return initialAsset;
    const usdt = userAssets.find((a) => a.symbol === 'USDT');
    if (usdt) return usdt;
    return userAssets[0] || INITIAL_ASSETS[0];
  });

  // Selected fiat option
  const [selectedFiat, setSelectedFiat] = useState<FiatTargetOption>(FIAT_TARGETS[0]);

  // Paso 3: Copia de datos
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // =========================================================================
  // DATOS BANCARIOS ASIGNADOS DESDE EL CRM PARA ESTE USUARIO
  // =========================================================================
  const bankInfo = useMemo(() => {
    const userBank = currentUser?.bankDetails;
    const fallbackRef = `TW-${(currentUser?.id || '01').replace('user_', '').toUpperCase()}-DEP`;
    return {
      accountHolderName: userBank?.accountHolderName || DEFAULT_BANK_DETAILS.accountHolderName,
      iban: userBank?.iban || DEFAULT_BANK_DETAILS.iban,
      swiftBic: userBank?.swiftBic || DEFAULT_BANK_DETAILS.swiftBic,
      reference: userBank?.reference || fallbackRef,
      bankName: userBank?.bankName || DEFAULT_BANK_DETAILS.bankName,
      country: userBank?.country || DEFAULT_BANK_DETAILS.country,
      notes: userBank?.notes || DEFAULT_BANK_DETAILS.notes,
    };
  }, [currentUser]);

  // =========================================================================
  // CONVERSIÓN AUTOMÁTICA A LA TASA DEL MOMENTO
  // =========================================================================
  const numericAmount = parseFloat(depositAmount) || 0;
  
  // Base rates to USD
  const fiatDepositToUsdRate = fiatCurrency === 'EUR' ? 1.08 : fiatCurrency === 'GBP' ? 1.28 : 1.00;
  const depositAmountUSD = numericAmount * fiatDepositToUsdRate;

  // Calculation when target is Crypto
  const convertedCryptoAmount = useMemo(() => {
    if (!selectedCrypto || selectedCrypto.usdPrice <= 0 || numericAmount <= 0) return 0;
    const tokens = depositAmountUSD / selectedCrypto.usdPrice;
    if (selectedCrypto.decimals <= 2 || selectedCrypto.symbol === 'USDT') {
      return Number(tokens.toFixed(2));
    }
    if (tokens < 0.001) {
      return Number(tokens.toFixed(6));
    }
    return Number(tokens.toFixed(4));
  }, [depositAmountUSD, selectedCrypto, numericAmount]);

  // Calculation when target is Fiat
  const convertedFiatAmount = useMemo(() => {
    if (numericAmount <= 0 || !selectedFiat || selectedFiat.usdRate <= 0) return 0;
    const units = depositAmountUSD / selectedFiat.usdRate;
    return Number(units.toFixed(2));
  }, [depositAmountUSD, selectedFiat, numericAmount]);

  const targetLabel = targetCategory === 'crypto' ? selectedCrypto.symbol : selectedFiat.symbol;
  const targetFormattedAmount = targetCategory === 'crypto'
    ? `${convertedCryptoAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${selectedCrypto.symbol}`
    : `${selectedFiat.sign}${convertedFiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${selectedFiat.symbol}`;

  const currentRateLabel = targetCategory === 'crypto'
    ? `1 ${selectedCrypto.symbol} ≈ $${selectedCrypto.usdPrice.toLocaleString()} USD`
    : `1 ${fiatCurrency} ≈ ${(fiatDepositToUsdRate / selectedFiat.usdRate).toFixed(4)} ${selectedFiat.symbol}`;

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    pushPushNotification('Copiado', `${label} copiado al portapapeles`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    const fullText = `DATOS DE TRANSFERENCIA BANCARIA TRUST WALLET:\n` +
      `Monto a Depositar: ${numericAmount.toFixed(2)} ${fiatCurrency}\n` +
      `Acreditar en: ${targetFormattedAmount}\n` +
      `Titular: ${bankInfo.accountHolderName}\n` +
      `IBAN: ${bankInfo.iban}\n` +
      `SWIFT / BIC: ${bankInfo.swiftBic}\n` +
      `Referencia Obligatoria: ${bankInfo.reference}\n` +
      `Banco: ${bankInfo.bankName} (${bankInfo.country})`;
    navigator.clipboard.writeText(fullText);
    setCopiedField('ALL');
    pushPushNotification('Datos Copiados', 'Todos los datos bancarios fueron copiados', 'success');
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Validar Paso 1
  const handleProceedToStep2 = () => {
    if (numericAmount < 50) {
      setAmountError('El monto mínimo de depósito es 50 ' + fiatCurrency);
      return;
    }
    setAmountError('');
    setStep('target_currency');
  };

  // Confirmar Transferencia (Paso 3)
  const handleConfirmTransfer = () => {
    // Generar transacción pendiente vinculada al usuario
    createCustomTransaction({
      userId: currentUser.id,
      type: 'receive',
      assetSymbol: targetCategory === 'crypto' ? selectedCrypto.symbol : selectedFiat.symbol,
      assetName: targetCategory === 'crypto' ? selectedCrypto.name : `Depósito Fiat ${selectedFiat.name}`,
      amount: targetCategory === 'crypto' ? convertedCryptoAmount : convertedFiatAmount,
      usdValue: depositAmountUSD,
      fromAddress: `Transferencia Bancaria (${bankInfo.bankName})`,
      toAddress:
        targetCategory === 'crypto'
          ? (selectedCrypto.network === 'bitcoin'
              ? currentUser.btcAddress
              : selectedCrypto.network === 'solana'
              ? currentUser.solAddress
              : currentUser.address)
          : currentUser.address,
      status: 'pending',
      timestamp: new Date().toISOString(),
      note: `Depósito ${numericAmount.toFixed(2)} ${fiatCurrency} en proceso. Referencia: ${bankInfo.reference}`,
      network: targetCategory === 'crypto' ? selectedCrypto.network : 'binance',
      networkFee: 0,
      networkFeeAsset: targetCategory === 'crypto' ? selectedCrypto.symbol : 'USD',
    });

    pushPushNotification(
      'Solicitud de Depósito Registrada',
      `Transacción pendiente por ${numericAmount} ${fiatCurrency}. Referencia: ${bankInfo.reference}`,
      'success'
    );

    setStep('success');
  };

  const depositCurrencySign = fiatCurrency === 'EUR' ? '€' : fiatCurrency === 'GBP' ? '£' : '$';

  return (
    <div className="absolute inset-0 bg-[#070b14] z-50 flex flex-col overflow-hidden text-white">
      {/* Top Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0 bg-[#0a0f1d]">
        <div className="flex items-center gap-2">
          {step !== 'amount' && step !== 'success' && (
            <button
              onClick={() => {
                if (step === 'target_currency') setStep('amount');
                if (step === 'bank_details') setStep('target_currency');
              }}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 mr-1 cursor-pointer transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <CreditCard size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Comprar Cripto (Checkout)</h3>
            <span className="text-[10px] text-slate-400">
              {step === 'amount' && 'Paso 1 de 3: Monto a depositar'}
              {step === 'target_currency' && 'Paso 2 de 3: Moneda a acreditar'}
              {step === 'bank_details' && 'Paso 3 de 3: Datos de depósito'}
              {step === 'success' && 'Solicitud registrada'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress Bar */}
      {step !== 'success' && (
        <div className="h-1 bg-slate-900 w-full flex">
          <div
            className={`h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 ${
              step === 'amount'
                ? 'w-1/3'
                : step === 'target_currency'
                ? 'w-2/3'
                : 'w-full'
            }`}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* ======================================================== */}
        {/* PASO 1: ELEGIR MONTO A DEPOSITAR                         */}
        {/* ======================================================== */}
        {step === 'amount' && (
          <div className="space-y-4">
            {/* Title / Intro */}
            <div className="text-center pt-2">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                Paso 1: Monto a Depositar
              </span>
              <h4 className="text-base font-extrabold text-white mt-2">
                ¿Cuánto deseas depositar?
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Selecciona la divisa y el importe que transferirás desde tu cuenta bancaria.
              </p>
            </div>

            {/* Currency Selector (EUR / USD / GBP) */}
            <div className="flex justify-center gap-2 pt-1">
              {(['EUR', 'USD', 'GBP'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setFiatCurrency(curr)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    fiatCurrency === curr
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400'
                      : 'bg-[#101726] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {curr === 'EUR' ? 'EUR (€)' : curr === 'USD' ? 'USD ($)' : 'GBP (£)'}
                </button>
              ))}
            </div>

            {/* Amount Input Box */}
            <div className="bg-[#0e1626] border border-slate-700/80 rounded-3xl p-5 text-center space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Importe a Transferir ({fiatCurrency})
              </span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-extrabold text-slate-400">{depositCurrencySign}</span>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositAmount(e.target.value);
                    if (parseFloat(e.target.value) >= 50) setAmountError('');
                  }}
                  className="bg-transparent text-4xl font-black text-white text-center focus:outline-none w-48 font-mono"
                  autoFocus
                />
              </div>

              {amountError && (
                <p className="text-xs text-rose-400 font-semibold flex items-center justify-center gap-1 pt-1">
                  <AlertCircle size={13} /> {amountError}
                </p>
              )}
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-bold px-1 uppercase tracking-wider">
                Montos frecuentes
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['100', '250', '500', '1000', '2500', '5000'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setDepositAmount(preset);
                      setAmountError('');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      depositAmount === preset
                        ? 'bg-blue-600/25 border-blue-500 text-blue-300'
                        : 'bg-[#101726] border-slate-800 hover:bg-[#16233a] text-slate-300'
                    }`}
                  >
                    {depositCurrencySign}{Number(preset).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Info notice */}
            <div className="p-3 bg-[#101726]/80 border border-slate-800 rounded-2xl flex items-start gap-2.5 text-xs text-slate-400">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Depósito mediante transferencia bancaria protegida (SEPA / SWIFT / Wire). Sin comisiones ocultas.
              </span>
            </div>

            {/* Bottom Button */}
            <div className="pt-2">
              <button
                onClick={handleProceedToStep2}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Continuar a Moneda a Acreditar</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 2: ELEGIR MONEDA A ACREDITAR (FIAT O CRYPTO)        */}
        {/* ======================================================== */}
        {step === 'target_currency' && (
          <div className="space-y-4">
            <div className="text-center pt-2">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                Paso 2: Moneda a Acreditar
              </span>
              <h4 className="text-base font-extrabold text-white mt-2">
                ¿Qué moneda deseas recibir?
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Elige entre criptomonedas o saldo fiduciario (FIAT). Conversión a la tasa del momento.
              </p>
            </div>

            {/* Category Selector Tabs (CRYPTO vs FIAT) */}
            <div className="grid grid-cols-2 gap-2 bg-[#0c1220] p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setTargetCategory('crypto')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  targetCategory === 'crypto'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins size={14} />
                <span>Criptomonedas</span>
              </button>
              <button
                onClick={() => setTargetCategory('fiat')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  targetCategory === 'fiat'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Banknote size={14} />
                <span>Monedas FIAT</span>
              </button>
            </div>

            {/* Real-time Conversion Result Card */}
            <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/40 rounded-3xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Depositas desde tu banco:</span>
                <span className="font-bold text-white font-mono">
                  {depositCurrencySign}{numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiatCurrency}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300">Recibirás en tu Billetera:</span>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-400 font-mono block">
                    {targetFormattedAmount}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ≈ ${depositAmountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Tasa del momento:</span>
                <span>{currentRateLabel}</span>
              </div>
            </div>

            {/* List of Options */}
            {targetCategory === 'crypto' ? (
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 font-bold px-1 uppercase tracking-wider">
                  Criptomonedas Disponibles
                </span>
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto no-scrollbar pr-1">
                  {userAssets.map((asset) => {
                    const isSelected = selectedCrypto.id === asset.id;
                    const estimatedForAsset = asset.usdPrice > 0 ? (depositAmountUSD / asset.usdPrice) : 0;
                    const formattedEstimate = asset.symbol === 'USDT'
                      ? estimatedForAsset.toFixed(2)
                      : estimatedForAsset < 0.001
                      ? estimatedForAsset.toFixed(6)
                      : estimatedForAsset.toFixed(4);

                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedCrypto(asset)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                            : 'bg-[#0e1626] border-slate-800 hover:bg-[#142036]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={asset.icon}
                            alt={asset.name}
                            className="w-9 h-9 rounded-full object-cover bg-slate-800"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white">{asset.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{asset.symbol}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{asset.networkName}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-xs text-white font-mono block">
                            +{formattedEstimate} {asset.symbol}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ${asset.usdPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 font-bold px-1 uppercase tracking-wider">
                  Divisas FIAT (Saldo Tradicional)
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {FIAT_TARGETS.map((fiat) => {
                    const isSelected = selectedFiat.symbol === fiat.symbol;
                    const units = depositAmountUSD / fiat.usdRate;

                    return (
                      <div
                        key={fiat.symbol}
                        onClick={() => setSelectedFiat(fiat)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                            : 'bg-[#0e1626] border-slate-800 hover:bg-[#142036]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-lg shadow-inner">
                            {fiat.flag}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block">{fiat.name}</span>
                            <span className="text-[10px] text-slate-500">Saldo fiduciario en cuenta</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-xs text-white font-mono block">
                            +{fiat.sign}{units.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fiat.symbol}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Tasa: 1 {fiat.symbol} = ${fiat.usdRate.toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Button */}
            <div className="pt-2">
              <button
                onClick={() => setStep('bank_details')}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Continuar a Datos de Depósito</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 3: DATOS DE DEPÓSITO Y REFERENCIA (DESDE CRM)       */}
        {/* ======================================================== */}
        {step === 'bank_details' && (
          <div className="space-y-4">
            <div className="text-center pt-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Paso 3: Instrucciones de Depósito
              </span>
              <h4 className="text-base font-extrabold text-white mt-2">
                Datos de Transferencia Bancaria
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Realiza la transferencia desde tu banco online usando los siguientes datos oficiales.
              </p>
            </div>

            {/* Order Summary Pill: MONTO (EL ELEGIDO ANTERIORMENTE) */}
            <div className="bg-[#111a2e] border border-blue-500/30 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Monto a Enviar:</span>
                <span className="text-lg font-black text-white font-mono">
                  {depositCurrencySign}{numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiatCurrency}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Acreditarás:</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {targetFormattedAmount}
                </span>
              </div>
            </div>

            {/* Mandatory Reference Alert: REFERENCIA */}
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertCircle size={15} /> Referencia Obligatoria:
                </span>
                <button
                  onClick={() => handleCopy(bankInfo.reference, 'Referencia')}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'Referencia' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedField === 'Referencia' ? 'Copiada' : 'Copiar'}</span>
                </button>
              </div>

              <div className="bg-[#090e18] p-2.5 rounded-xl border border-amber-500/30 font-mono text-sm font-black text-amber-300 text-center tracking-wider selection:bg-amber-400 selection:text-black">
                {bankInfo.reference}
              </div>

              <p className="text-[10px] text-amber-200/80 leading-relaxed">
                ⚠️ <strong>Muy importante:</strong> Coloca esta referencia exacta en el campo <em>"Concepto"</em> o <em>"Motivo"</em> de tu transferencia bancaria para acreditación automática.
              </p>
            </div>

            {/* Bank Fields Table */}
            <div className="bg-[#0e1626] border border-slate-700/80 rounded-3xl p-4 space-y-3">
              {/* NOMBRE DE CUENTAHABIENTE */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Nombre del Cuentahabiente / Beneficiario
                  </span>
                  <span className="text-xs font-extrabold text-white">
                    {bankInfo.accountHolderName}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.accountHolderName, 'Cuentahabiente')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copiar Cuentahabiente"
                >
                  {copiedField === 'Cuentahabiente' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              {/* IBAN */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    IBAN (Número de Cuenta)
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-300 break-all">
                    {bankInfo.iban}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.iban, 'IBAN')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  title="Copiar IBAN"
                >
                  {copiedField === 'IBAN' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              {/* SWIFT / BIC */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    SWIFT / BIC
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {bankInfo.swiftBic}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.swiftBic, 'SWIFT / BIC')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copiar SWIFT/BIC"
                >
                  {copiedField === 'SWIFT / BIC' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              {/* BANCO / ENTIDAD */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Entidad Bancaria & Región
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {bankInfo.bankName} {bankInfo.country ? `(${bankInfo.country})` : ''}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.bankName, 'Banco')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copiar Banco"
                >
                  {copiedField === 'Banco' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyAll}
                className="flex-1 py-2.5 bg-[#121c2d] hover:bg-[#18263e] border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedField === 'ALL' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedField === 'ALL' ? '¡Todo Copiado!' : 'Copiar Todos los Datos'}</span>
              </button>
            </div>

            {/* Confirmation Button */}
            <div className="pt-2">
              <button
                onClick={handleConfirmTransfer}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>He Realizado la Transferencia</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PANTALLA FINAL: NOTIFICACIÓN DE PAGO CONFIRMADA          */}
        {/* ======================================================== */}
        {step === 'success' && (
          <div className="space-y-5 text-center py-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">
                ¡Transferencia Bancaria Registrada!
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Tu solicitud por <strong className="text-white">{depositCurrencySign}{numericAmount} {fiatCurrency}</strong> ha sido registrada en el sistema.
              </p>
            </div>

            {/* Summary card */}
            <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Referencia asignada:</span>
                <span className="font-mono font-bold text-amber-300">{bankInfo.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Acreditación estimada:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {targetFormattedAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estado:</span>
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  <Clock size={12} className="animate-spin" /> Verificación en proceso
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
              Una vez acreditados los fondos por la entidad bancaria, tu balance se actualizará automáticamente y recibirás una notificación push en tu dispositivo.
            </p>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
            >
              Volver a la Billetera
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
