import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, Battery, Signal, Bell, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface AndroidFrameProps {
  children: React.ReactNode;
  standalone?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, standalone = false }) => {
  const { activeNotification, dismissNotification } = useWallet();
  const [currentTime, setCurrentTime] = React.useState('12:45');

  React.useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (standalone) {
    return (
      <div className="w-full h-full min-h-screen bg-[#050811] text-white flex flex-col relative select-none overflow-hidden">
        {/* Real-time Android Push Notification Toast */}
        <AnimatePresence>
          {activeNotification && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed top-3 left-4 right-4 z-50 bg-[#162032]/95 backdrop-blur-md border border-blue-500/40 rounded-2xl p-3 shadow-2xl flex items-start gap-3 text-white max-w-md mx-auto"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                {activeNotification.type === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : activeNotification.type === 'alert' ? (
                  <AlertCircle size={16} className="text-rose-400" />
                ) : (
                  <Info size={16} className="text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                    <Bell size={10} /> Trust Wallet • Ahora
                  </span>
                  <button
                    onClick={dismissNotification}
                    className="text-slate-400 hover:text-white p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
                <p className="text-xs font-bold text-white mt-0.5 truncate">
                  {activeNotification.title}
                </p>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                  {activeNotification.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-screen wallet container */}
        <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[395px] h-[830px] bg-[#0c1017] text-white rounded-[44px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_10px_#1e2638,0_0_0_12px_#334155] border-2 border-slate-700/60 flex flex-col overflow-hidden select-none">
      {/* Top Camera Notch & Speaker */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <div className="w-12 h-1 bg-slate-800 rounded-full" />
        <div className="w-3.5 h-3.5 bg-black rounded-full border border-slate-700 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-blue-950 rounded-full" />
        </div>
      </div>

      {/* Android Status Bar */}
      <div className="h-7 px-4 pt-1 flex items-center justify-between text-xs text-slate-300 font-medium z-40 bg-transparent">
        <span>{currentTime}</span>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-[10px] font-bold text-blue-400">5G</span>
          <Signal size={12} className="text-slate-200" />
          <Wifi size={13} className="text-slate-200" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold">98%</span>
            <Battery size={14} className="text-emerald-400 fill-emerald-400" />
          </div>
        </div>
      </div>

      {/* Real-time Android Push Notification Toast */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute top-9 left-4 right-4 z-50 bg-[#162032]/95 backdrop-blur-md border border-blue-500/40 rounded-2xl p-3 shadow-2xl flex items-start gap-3 text-white"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500 flex items-center justify-center shrink-0 mt-0.5">
              {activeNotification.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : activeNotification.type === 'alert' ? (
                <AlertCircle size={16} className="text-rose-400" />
              ) : (
                <Info size={16} className="text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Bell size={10} /> Trust Wallet • Ahora
                </span>
                <button
                  onClick={dismissNotification}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
              <p className="text-xs font-bold text-white mt-0.5 truncate">
                {activeNotification.title}
              </p>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                {activeNotification.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Screen Internal Body */}
      <div className="flex-1 relative flex flex-col bg-[#050811] rounded-[32px] overflow-hidden">
        {children}
      </div>

      {/* Android Bottom Navigation Pill */}
      <div className="h-4 flex items-center justify-center pt-1">
        <div className="w-28 h-1 bg-slate-500/60 rounded-full hover:bg-slate-300 transition-colors" />
      </div>
    </div>
  );
};
