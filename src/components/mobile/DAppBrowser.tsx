import React, { useState } from 'react';
import { Compass, Globe, ExternalLink, ShieldCheck, Search, ArrowLeft, RefreshCw, X, Link2, CheckCircle2 } from 'lucide-react';
import { DAPPS_LIST } from '../../data/initialData';
import { DAppItem } from '../../types';
import { useWallet } from '../../context/WalletContext';

export const DAppBrowser: React.FC = () => {
  const {
    currentUser,
    activeDAppSessions,
    requestDAppConnection,
    disconnectDApp,
    pushPushNotification,
  } = useWallet();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchUrl, setSearchUrl] = useState<string>('');
  const [selectedDApp, setSelectedDApp] = useState<DAppItem | null>(null);
  const [dappStateAmount, setDappStateAmount] = useState<string>('1.0');
  const [isConnectingDapp, setIsConnectingDapp] = useState<boolean>(false);

  const categories = ['All', 'DeFi', 'Dex', 'NFT', 'Staking'];

  const filteredDApps = DAPPS_LIST.filter((d) => {
    const matchCategory = activeCategory === 'All' || d.category === activeCategory;
    const matchSearch =
      d.name.toLowerCase().includes(searchUrl.toLowerCase()) ||
      d.url.toLowerCase().includes(searchUrl.toLowerCase()) ||
      d.description.toLowerCase().includes(searchUrl.toLowerCase());
    return matchCategory && matchSearch;
  });

  const isConnected = selectedDApp
    ? activeDAppSessions.some((s) => s.dappName === selectedDApp.name)
    : false;

  const handleConnectDApp = () => {
    if (!selectedDApp) return;
    setIsConnectingDapp(true);
    setTimeout(() => {
      requestDAppConnection(selectedDApp);
      setIsConnectingDapp(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-[#050811] text-white overflow-y-auto no-scrollbar">
      {/* Top URL / Search Bar */}
      <div className="h-14 px-4 flex items-center gap-2 border-b border-slate-800/60 shrink-0 bg-[#070b14]">
        {selectedDApp && (
          <button
            onClick={() => setSelectedDApp(null)}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="flex-1 bg-[#101726] border border-slate-800 rounded-2xl px-3 py-1.5 flex items-center gap-2">
          <Globe size={14} className="text-blue-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar o ingresar URL de DApp..."
            value={selectedDApp ? selectedDApp.url : searchUrl}
            onChange={(e) => setSearchUrl(e.target.value)}
            disabled={!!selectedDApp}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          {searchUrl && !selectedDApp && (
            <button onClick={() => setSearchUrl('')} className="text-slate-400">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* DAPP SIMULATED WEBVIEW VIEW */}
      {selectedDApp ? (
        <div className="flex-1 flex flex-col bg-[#0b101c] p-4 text-white overflow-y-auto space-y-4 animate-in fade-in">
          {/* DApp Banner Header */}
          <div className="bg-[#121a2c] border border-slate-800 rounded-3xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedDApp.icon}
                alt={selectedDApp.name}
                className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md object-contain"
              />
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  {selectedDApp.name}
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded font-medium">
                    {selectedDApp.network.toUpperCase()}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                  {selectedDApp.url}
                </p>
              </div>
            </div>

            {/* WalletConnect Status */}
            <div>
              {isConnected ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold">
                  <CheckCircle2 size={14} />
                  Enlazado
                </div>
              ) : (
                <button
                  onClick={handleConnectDApp}
                  disabled={isConnectingDapp}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-500/20 flex items-center gap-1"
                >
                  <Link2 size={13} />
                  {isConnectingDapp ? 'Conectando...' : 'Conectar'}
                </button>
              )}
            </div>
          </div>

          {/* DApp Interactive Workspace */}
          <div className="bg-[#101726] border border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Terminal Web3 Descentralizado</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {currentUser.address.substring(0, 6)}...{currentUser.address.substring(38)}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedDApp.description}
            </p>

            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Interacción Inteligente de Contrato</span>
                <span className="text-blue-400 font-semibold">Web3 Provider Activo</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={dappStateAmount}
                  onChange={(e) => setDappStateAmount(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  placeholder="Monto"
                />
                <button
                  onClick={() =>
                    pushPushNotification(
                      'Firma de Contrato Web3',
                      `Solicitud de llamada de contrato enviada a ${selectedDApp.name} por ${dappStateAmount} tokens`,
                      'info'
                    )
                  }
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90"
                >
                  Firmar y Ejecutar
                </button>
              </div>
            </div>
          </div>

          {/* External browser open */}
          <div className="text-center pt-2">
            <a
              href={selectedDApp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline"
            >
              <ExternalLink size={13} />
              Abrir sitio web oficial en pestaña nueva
            </a>
          </div>
        </div>
      ) : (
        /* DAPP DIRECTORY VIEW */
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-[#101726] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat === 'All' ? 'Todos' : cat}
              </button>
            ))}
          </div>

          {/* Featured Web3 Banner */}
          <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/40 border border-blue-500/30 rounded-3xl p-4 flex items-center justify-between">
            <div className="space-y-1 max-w-[200px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <ShieldCheck size={12} /> Web3 Integrado
              </span>
              <h4 className="font-bold text-xs text-white">Explora DeFi & DApps</h4>
              <p className="text-[11px] text-slate-300 leading-snug">
                Navegador descentralizado seguro con WalletConnect v2.
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Compass size={20} />
            </div>
          </div>

          {/* DApps Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              DApps Populares Verificadas
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {filteredDApps.map((dapp) => (
                <div
                  key={dapp.id}
                  onClick={() => setSelectedDApp(dapp)}
                  className="bg-[#0e1626] hover:bg-[#142036] border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={dapp.icon}
                      alt={dapp.name}
                      className="w-10 h-10 rounded-xl bg-white p-1 object-contain shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white group-hover:text-blue-400">
                          {dapp.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-semibold">
                          {dapp.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px] mt-0.5">
                        {dapp.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-slate-500 group-hover:text-blue-400 transition-colors">
                    <ExternalLink size={15} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
