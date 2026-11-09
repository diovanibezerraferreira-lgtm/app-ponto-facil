import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, History, Clock, KeyRound, Calendar, UserCheck } from 'lucide-react';
import { AuditLog, Company } from '../../types';
import { formatDateBR } from '../../utils/formatters';

interface AuditTrailViewProps {
  company: Company;
  logs: AuditLog[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ company, logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.employeeName && log.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'ALL' || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'punch_adjust':
      case 'punch_manual_create':
        return {
          label: 'Ajuste de Ponto',
          class: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Clock className="w-3 h-3 text-amber-600" />,
        };
      case 'pin_change':
        return {
          label: 'Alteração de PIN',
          class: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <KeyRound className="w-3 h-3 text-blue-600" />,
        };
      case 'pin_block':
        return {
          label: 'Bloqueio de PIN',
          class: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: <KeyRound className="w-3 h-3 text-rose-600" />,
        };
      case 'pin_unblock':
        return {
          label: 'Desbloqueio de PIN',
          class: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <KeyRound className="w-3 h-3 text-emerald-600" />,
        };
      case 'schedule_change':
        return {
          label: 'Alteração de Jornada',
          class: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: <Calendar className="w-3 h-3 text-purple-600" />,
        };
      default:
        return {
          label: 'Ação Administrativa',
          class: 'bg-slate-50 text-slate-800 border-slate-200',
          icon: <UserCheck className="w-3 h-3 text-slate-600" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Trilha de Auditoria & Histórico de Alterações
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro imutável de todas as modificações de ponto, códigos de acesso e jornadas realizadas pelos administradores (Portaria 671 e LGPD).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por colaborador ou admin..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 w-64"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="ALL">Todas as Ações</option>
            <option value="punch_adjust">Ajustes de Ponto</option>
            <option value="pin_change">Alterações de PIN</option>
            <option value="pin_block">Bloqueios de PIN</option>
            <option value="schedule_change">Jornadas & Horários</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Data & Horário</th>
                <th className="py-3 px-3">Tipo de Ação</th>
                <th className="py-3 px-3">Colaborador</th>
                <th className="py-3 px-3">Detalhes / Justificativa Legal</th>
                <th className="py-3 px-3">Valor Anterior ➔ Novo</th>
                <th className="py-3 px-4 text-right">Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.action);
                const d = new Date(log.timestamp);
                const dateFormatted = `${formatDateBR(d.toISOString().split('T')[0])} às ${d.toLocaleTimeString('pt-BR')}`;

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {dateFormatted}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {log.employeeName || 'Todos / Sistema'}
                    </td>

                    <td className="py-3 px-3 text-slate-700 max-w-xs">
                      <p className="line-clamp-2">{log.details}</p>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {log.oldValue && log.newValue ? (
                        <span>
                          <span className="text-slate-400">{log.oldValue}</span>
                          <span className="text-emerald-600 font-bold mx-1.5">➔</span>
                          <span className="text-slate-900 font-bold">{log.newValue}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <p className="font-bold text-slate-800">{log.adminName}</p>
                      <p className="text-[10px] text-slate-400">{log.adminEmail}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum registro de auditoria encontrado.
          </div>
        )}
      </div>
    </div>
  );
};
