import React, { useState } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  Terminal,
  ChevronRight,
  Wifi,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';

interface AndroidApkModalProps {
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ onClose }) => {
  const { pushPushNotification, currentUser } = useWallet();
  const [activeTab, setActiveTab] = useState<'qr' | 'install_pwa' | 'build_apk'>('qr');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  // Derive direct mobile testing link
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const mobileAppUrl = `${currentOrigin}/?mode=mobile`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(mobileAppUrl);
    setCopiedUrl(true);
    pushPushNotification('Enlace Copiado', 'URL directa para Android copiada al portapapeles', 'info');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const capacitorBuildScript = `# 1. Clonar o exportar el proyecto e instalar dependencias
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Trust Wallet" "com.trustwallet.crypto" --web-dir=dist

# 2. Compilar la aplicación web
npm run build

# 3. Agregar plataforma Android y sincronizar
npx cap add android
npx cap sync android

# 4. Generar el APK compilado con Gradle
cd android
./gradlew assembleDebug

# El archivo APK generado estará en:
# android/app/build/outputs/apk/debug/app-debug.apk`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(capacitorBuildScript);
    setCopiedCli(true);
    pushPushNotification('Comandos Copiados', 'Script de compilación APK copiado', 'info');
    setTimeout(() => setCopiedCli(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0b101d] border border-slate-700/80 rounded-3xl p-6 text-white space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0500FF]/20 text-[#00D4FF] border border-[#0500FF]/40 flex items-center justify-center shadow-lg shadow-[#0500FF]/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Instalar & Probar en Android (APK / WebAPK)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Conexión bidireccional en tiempo real con tu panel de control CRM
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-[#0500FF] text-white shadow-md shadow-[#0500FF]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>1. Probar en Vivo (QR)</span>
          </button>

          <button
            onClick={() => setActiveTab('build_apk')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'build_apk'
                ? 'bg-[#0500FF] text-white shadow-md shadow-[#0500FF]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>2. Generar APK 100% Online</span>
          </button>

          <button
            onClick={() => setActiveTab('install_pwa')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'install_pwa'
                ? 'bg-[#0500FF] text-white shadow-md shadow-[#0500FF]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>3. Instalar en Móvil sin Descargas</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: QR CODE & DIRECT LINK                             */}
        {/* ======================================================== */}
        {activeTab === 'qr' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center bg-[#070b14] border border-slate-800/90 rounded-3xl p-5">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={mobileAppUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: '/trust-wallet-icon.svg',
                    x: undefined,
                    y: undefined,
                    height: 38,
                    width: 38,
                    excavate: true,
                  }}
                />
                <span className="text-[11px] font-bold text-slate-800 mt-2">
                  Escanea con la cámara de tu Android
                </span>
              </div>

              {/* Instructions on the right */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0500FF]/15 border border-[#0500FF]/30 text-xs font-bold text-[#00D4FF]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sincronización Instantánea</span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">
                  Abre la app en cualquier teléfono Android en 3 segundos
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Al abrir este enlace en tu navegador móvil (Chrome, Brave o Samsung Internet), la app cargará automáticamente la interfaz de Trust Wallet a pantalla completa vinculada a tu usuario activo: <strong className="text-white">{currentUser.name}</strong>.
                </p>

                <div className="pt-1">
                  <button
                    onClick={handleCopyUrl}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-[#00D4FF] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedUrl ? '¡Enlace copiado!' : 'Copiar URL para el navegador móvil'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Link Input */}
            <div className="flex items-center gap-2 p-2 bg-[#121929] border border-slate-800 rounded-2xl">
              <input
                type="text"
                readOnly
                value={mobileAppUrl}
                className="flex-1 bg-transparent border-none text-xs font-mono text-slate-300 px-3 focus:outline-none truncate"
              />
              <button
                onClick={handleCopyUrl}
                className="px-4 py-2 bg-[#0500FF] hover:bg-[#0047e0] text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar</span>
              </button>
              <a
                href={mobileAppUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Abrir en pestaña nueva"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: INSTALL PWA (WebAPK) DIRECTLY ON ANDROID PHONE     */}
        {/* ======================================================== */}
        {activeTab === 'install_pwa' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-200/90 leading-relaxed">
                <strong>¿Cómo funciona la instalación directa en Android?</strong>
                <br />
                Gracias a los archivos de manifiesto PWA preconfigurados (<code className="font-mono text-emerald-300">manifest.json</code> y Service Worker), Android genera automáticamente un <strong>WebAPK nativo</strong> con su propio icono de Trust Wallet, pantalla completa sin barras de Chrome y respuesta ultra-rápida.
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Pasos para instalar en 30 segundos:
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-[#0500FF] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-white block">Abre el enlace en Google Chrome en tu Android:</strong>
                    <span className="text-slate-400">Escanea el código QR o copia y pega el enlace compartido en Chrome.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-[#0500FF] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-white block">Toca el menú de 3 puntos (⋮):</strong>
                    <span className="text-slate-400">En la esquina superior derecha del navegador Chrome en tu teléfono.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-[#0500FF] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-white block">Pulsa "Instalar aplicación" o "Añadir a la pantalla de inicio":</strong>
                    <span className="text-slate-400">Android creará la app con el nombre oficial e icono de escudo de Trust Wallet.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div>
                    <strong className="text-emerald-300 block">¡Listo para usar!</strong>
                    <span className="text-slate-400">Ábrela desde el cajón de aplicaciones de tu móvil. Todos los cambios que hagas en el panel CRM (balances, swaps, envíos, transacciones) se verán reflejados al instante.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: GENERATE APK 100% ONLINE (NO APPS INSTALLED)     */}
        {/* ======================================================== */}
        {activeTab === 'build_apk' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#00D4FF] shrink-0 mt-0.5" />
              <div className="text-xs text-blue-200/90 leading-relaxed">
                <strong className="text-white block mb-0.5">Generadores de APK 100% en la Nube (Gratuitos)</strong>
                No necesitas instalar Android Studio ni nada en tu computadora. Simplemente pega el enlace de tu app en cualquiera de estas plataformas online para que sus servidores compilen y te entreguen el archivo <code className="font-mono text-[#00D4FF] bg-blue-950/60 px-1 py-0.5 rounded">.apk</code> descargable en 1 minuto.
              </div>
            </div>

            {/* URL to copy box */}
            <div className="p-3 bg-[#0d1424] border border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">1. Tu URL pública para ingresar en el generador:</span>
                <span className="text-[11px] text-emerald-400 font-mono">Conectada al CRM</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={mobileAppUrl}
                  className="flex-1 bg-black/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none truncate"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-4 py-2 bg-[#0500FF] hover:bg-[#0047e0] text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? '¡Copiado!' : 'Copiar URL'}</span>
                </button>
              </div>
            </div>

            {/* Cloud Builders Selection */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Elige un generador gratuito en la nube:
              </h4>

              {/* Option 1: PWABuilder (Official Microsoft) */}
              <div className="p-4 rounded-2xl bg-[#0f172a] border border-blue-500/20 hover:border-blue-500/50 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                    <strong className="text-sm text-white font-bold">PWABuilder (Recomendado - Microsoft)</strong>
                  </div>
                  <a
                    href={`https://www.pwabuilder.com?url=${encodeURIComponent(mobileAppUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <span>Abrir PWABuilder</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-400">
                  Detecta automáticamente el <code className="text-slate-300">manifest.json</code> y el icono oficial de Trust Wallet. Pulsa <strong>"Package for Stores"</strong> &rarr; <strong>"Android"</strong> &rarr; <strong>"Generate APK / Bundle"</strong>.
                </p>
              </div>

              {/* Option 2: AppsGeyser (Direct instant APK) */}
              <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                    <strong className="text-sm text-white font-bold">AppsGeyser (Generación Directa .APK)</strong>
                  </div>
                  <a
                    href="https://appsgeyser.com/create-url-app/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/30"
                  >
                    <span>Abrir AppsGeyser</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-400">
                  Pega la URL de arriba en la casilla "Website URL", ponle de nombre "Trust Wallet" y pulsa <strong>"Download APK"</strong> para descargar el archivo <code className="text-slate-300">.apk</code> directamente.
                </p>
              </div>

              {/* Option 3: WebIntoApp */}
              <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                    <strong className="text-sm text-white font-bold">WebIntoApp (Online APK Maker)</strong>
                  </div>
                  <a
                    href="https://www.webintoapp.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-purple-500/30"
                  >
                    <span>Abrir WebIntoApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-400">
                  Ingresa la URL copiada, selecciona la opción "Free Maker" y descarga el archivo <code className="text-slate-300">app-release.apk</code> sin registro obligatorio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-500">
            Trust Wallet v8.12 • Sincronización WebSockets y LocalStorage
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
