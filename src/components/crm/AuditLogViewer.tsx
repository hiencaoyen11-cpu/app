import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import { AuditLog } from '../../types';
import { useWallet } from '../../context/WalletContext';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs, clearAuditLogs, users, pushPushNotification } = useWallet();
  const [search, setSearch] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.admin.toLowerCase().includes(search.toLowerCase()) ||
      log.userId.toLowerCase().includes(search.toLowerCase());

    const matchAction = filterAction === 'ALL' || log.action === filterAction;
    return matchSearch && matchAction;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `trustwallet_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    pushPushNotification('Auditoría Exportada', 'Archivo JSON generado y descargado', 'success');
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Action', 'Admin', 'User ID', 'Details'];
    const rows = auditLogs.map(l => [
      l.id,
      l.timestamp,
      l.action,
      `"${l.admin}"`,
      l.userId,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trustwallet_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    pushPushNotification('Auditoría CSV Exportada', 'Archivo CSV descargado con éxito', 'success');
  };

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'BALANCE_MODIFIED':
        return <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold">BALANCE CRM</span>;
      case 'TRANSACTION_GENERATED':
        return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-bold">TX GENERADA</span>;
      case 'TRANSACTION_SENT':
        return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">TX ENVIADA (APP)</span>;
      case 'SECURITY_UPDATED':
        return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold">SEGURIDAD</span>;
      case 'DAPP_CONNECTED':
        return <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold">WEB3 DAPP</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold">{action}</span>;
    }
  };

  return (
    <div className="p-6 space-y-5 text-white overflow-y-auto max-h-[calc(100vh-200px)] no-scrollbar">
      {/* Header with Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101726] border border-slate-700/80 rounded-3xl p-5">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            Registro de Auditoría y Movimientos en Tiempo Real
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Registro cronológico inmutable de todas las modificaciones de saldo, transacciones remotas y eventos del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-[#141f33] hover:bg-[#1a2842] border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download size={13} /> Exportar CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-[#141f33] hover:bg-[#1a2842] border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download size={13} /> Exportar JSON
          </button>
          <button
            onClick={clearAuditLogs}
            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Trash2 size={13} /> Limpiar Logs
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o detalle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#101726] border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'BALANCE_MODIFIED', label: 'Balances' },
            { id: 'TRANSACTION_GENERATED', label: 'Tx Generadas' },
            { id: 'TRANSACTION_SENT', label: 'Tx Enviadas' },
            { id: 'SECURITY_UPDATED', label: 'Seguridad' },
            { id: 'DAPP_CONNECTED', label: 'Web3' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterAction(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterAction === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#101726] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#141f33] text-slate-400 font-bold border-b border-slate-800">
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Tipo de Evento</th>
                <th className="py-3 px-4">Usuario / Cartera</th>
                <th className="py-3 px-4">Administrador</th>
                <th className="py-3 px-4">Detalle de la Operación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No hay registros que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const targetUser = users.find(u => u.id === log.userId);
                  return (
                    <tr key={log.id} className="hover:bg-[#121b2d] transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-200">
                        {targetUser ? targetUser.name : log.userId}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {log.admin}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
