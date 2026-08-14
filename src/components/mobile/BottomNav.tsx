import React from 'react';
import { Wallet, ArrowLeftRight, Compass, Settings } from 'lucide-react';

export type TabType = 'wallet' | 'swap' | 'browser' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'wallet' as TabType, label: 'Billetera', icon: Wallet },
    { id: 'swap' as TabType, label: 'Canjear', icon: ArrowLeftRight },
    { id: 'browser' as TabType, label: 'Navegador', icon: Compass },
    { id: 'settings' as TabType, label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="h-16 bg-[#080d1a]/95 backdrop-blur-md border-t border-slate-800/80 px-2 flex items-center justify-around z-30 shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex flex-col items-center justify-center w-16 py-1 transition-all relative ${
              isActive ? 'text-[#0500FF] font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
                isActive ? 'bg-[#0052FF]/20 text-[#3b82f6]' : ''
              }`}
            >
              <Icon size={20} className={isActive ? 'text-[#3875f6]' : 'text-slate-400'} />
            </div>
            <span
              className={`text-[10px] tracking-tight mt-0.5 ${
                isActive ? 'text-[#3875f6] font-semibold' : 'text-slate-400'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
