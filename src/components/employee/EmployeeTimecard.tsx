import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { Employee, PunchRecord, AdjustmentRequest, Company } from '../../types';
import {
  formatDateBR,
  formatMinutesToHours,
  formatTimeHHMM,
  getPunchTypeLabel,
  calculateMinutesBetweenTimes,
} from '../../utils/formatters';

interface EmployeeTimecardProps {
  employee: Employee;
  company?: Company;
  punches: PunchRecord[];
  adjustments: AdjustmentRequest[];
  onOpenAdjustmentModal: () => void;
}

export const EmployeeTimecard: React.FC<EmployeeTimecardProps> = ({
  employee,
  company,
  punches,
  adjustments,
  onOpenAdjustmentModal,
}) => {
  const [activeTab, setActiveTab] = useState<'timecard' | 'adjustments'>('timecard');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = current month, -1 = last month

  // Compute month
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + selectedMonthOffset);
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth(); // 0-11
  const monthName = targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Generate days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysList: {
    dateStr: string;
    dayNum: number;
    dayOfWeekName: string;
    isWeekend: boolean;
    isToday: boolean;
  }[] = [];

  const todayStr = new Date().toISOString().split('T')[0];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(currentYear, currentMonth, d);
    const dayOfWeek = dayDate.getDay();
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeekNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    daysList.push({
      dateStr,
      dayNum: d,
      dayOfWeekName: dayOfWeekNames[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: dateStr === todayStr,
    });
  }

  // Calculate day-by-day stats
  let monthTotalWorkedMinutes = 0;
  let monthTotalTargetMinutes = 0;

  const rows = daysList.map((day) => {
    const dayPunches = punches
      .filter((p) => p.date === day.dateStr && p.employeeId === employee.id)
      .sort((a, b) => a.timestamp - b.timestamp);

    const entry = dayPunches.find((p) => p.type === 'entry');
    const lunchOut = dayPunches.find((p) => p.type === 'lunch_start');
    const lunchIn = dayPunches.find((p) => p.type === 'lunch_end');
    const exit = dayPunches.find((p) => p.type === 'exit');
    const extras = dayPunches.filter((p) => p.type === 'extra');

    let workedMinutes = 0;
    if (entry && lunchOut) {
      workedMinutes += calculateMinutesBetweenTimes(entry.time, lunchOut.time);
    }
    if (lunchIn && exit) {
      workedMinutes += calculateMinutesBetweenTimes(lunchIn.time, exit.time);
    } else if (!lunchOut && !lunchIn && entry && exit) {
      workedMinutes += calculateMinutesBetweenTimes(entry.time, exit.time);
    }

    const target = day.isWeekend ? 0 : employee.dailyTargetMinutes;

    // Only count target if date is today or in the past
    const isPastOrToday = day.dateStr <= todayStr;
    if (isPastOrToday && !day.isWeekend) {
      monthTotalTargetMinutes += target;
      monthTotalWorkedMinutes += workedMinutes;
    }

    const dayBalance = workedMinutes - target;

    let statusText = 'Normal';
    let statusColor = 'text-slate-600 bg-slate-100';

    if (day.isWeekend) {
      statusText = 'DSR / Folga';
      statusColor = 'text-slate-400 bg-slate-50';
    } else if (dayPunches.length === 0) {
      if (isPastOrToday && day.dateStr < todayStr) {
        statusText = 'Falta / Sem Marcação';
        statusColor = 'text-rose-700 bg-rose-50 border border-rose-200';
      } else {
        statusText = 'Aguardando';
        statusColor = 'text-slate-400 bg-slate-50';
      }
    } else if (dayBalance > 10) {
      statusText = `+${formatMinutesToHours(dayBalance)} Extra`;
      statusColor = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
    } else if (dayBalance < -10 && exit) {
      statusText = `${formatMinutesToHours(dayBalance)} Débito`;
      statusColor = 'text-amber-700 bg-amber-50 border border-amber-200';
    } else if (day.isToday) {
      statusText = 'Em andamento';
      statusColor = 'text-blue-700 bg-blue-50 border border-blue-200';
    }

    return {
      ...day,
      entry: entry?.time ? formatTimeHHMM(entry.time) : '--:--',
      lunchOut: lunchOut?.time ? formatTimeHHMM(lunchOut.time) : '--:--',
      lunchIn: lunchIn?.time ? formatTimeHHMM(lunchIn.time) : '--:--',
      exit: exit?.time ? formatTimeHHMM(exit.time) : '--:--',
      extrasCount: extras.length,
      workedMinutes,
      target,
      dayBalance,
      statusText,
      statusColor,
      hasAdjustment: dayPunches.some((p) => p.manualAdjustment),
    };
  });

  const monthBalance = monthTotalWorkedMinutes - monthTotalTargetMinutes;

  return (
    <div className="space-y-6">
      {/* Sub Tabs: Espelho de Ponto vs Minhas Solicitações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('timecard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'timecard'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Espelho Mensal de Ponto</span>
          </button>
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'adjustments'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Solicitações & Atestados</span>
            {adjustments.filter((a) => a.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAdjustmentModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Solicitar Ajuste / Atestado</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir Espelho</span>
          </button>
        </div>
      </div>

      {activeTab === 'timecard' ? (
        <div className="space-y-6">
          {/* Month selector & Quick KPI Cards */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedMonthOffset((prev) => prev - 1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-slate-800 capitalize min-w-[150px] text-center">
                  {monthName}
                </span>
                <button
                  onClick={() => setSelectedMonthOffset((prev) => Math.min(0, prev + 1))}
                  disabled={selectedMonthOffset >= 0}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-30"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Monthly mini balances */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Trabalhado no Mês
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {formatMinutesToHours(monthTotalWorkedMinutes)}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Saldo do Mês
                </span>
                <span
                  className={`text-xs font-mono font-bold flex items-center gap-1 ${
                    monthBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {monthBalance >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {formatMinutesToHours(monthBalance, true)}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-800 font-semibold uppercase block">
                  Banco de Horas Geral
                </span>
                <span className="text-xs font-mono font-extrabold text-emerald-700">
                  {formatMinutesToHours(employee.timeBankMinutes, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 sm:px-4">Data</th>
                    <th className="py-3 px-2 text-center">1ª Ent.</th>
                    <th className="py-3 px-2 text-center">1ª Saída</th>
                    <th className="py-3 px-2 text-center">2ª Ent.</th>
                    <th className="py-3 px-2 text-center">2ª Saída</th>
                    <th className="py-3 px-2 text-center">Horas Trab.</th>
                    <th className="py-3 px-2 text-center">Saldo</th>
                    <th className="py-3 px-3 text-right">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr
                      key={row.dateStr}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        row.isToday
                          ? 'bg-emerald-50/40 font-medium'
                          : row.isWeekend
                          ? 'bg-slate-50/40 text-slate-400'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-6 text-center text-[10px] font-bold px-1 py-0.5 rounded ${
                              row.isWeekend
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {row.dayOfWeekName}
                          </span>
                          <span className="font-mono text-slate-800 font-medium">
                            {formatDateBR(row.dateStr).slice(0, 5)}
                          </span>
                          {row.isToday && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold uppercase tracking-wider">
                              Hoje
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                        {row.entry}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                        {row.lunchOut}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                        {row.lunchIn}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                        {row.exit}
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                        {row.workedMinutes > 0 ? formatMinutesToHours(row.workedMinutes) : '--:--'}
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-semibold">
                        {row.workedMinutes > 0 ? (
                          <span
                            className={row.dayBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}
                          >
                            {formatMinutesToHours(row.dayBalance, true)}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${row.statusColor}`}
                        >
                          {row.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span>* Tolerância padrão conforme Artigo 58 CLT (5 min por marcação / 10 min diários)</span>
              <span>Carga horária cadastrada: {employee.workScheduleName}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Tab: Adjustments & Medical Certificates */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Histórico de Solicitações e Atestados
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Acompanhe o andamento das suas solicitações de inclusão de ponto e envio de comprovantes.
            </p>

            {adjustments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Nenhuma solicitação registrada até o momento.
              </div>
            ) : (
              <div className="space-y-3">
                {adjustments.map((adj) => {
                  const statusBadges = {
                    pending: {
                      label: 'Pendente de Análise',
                      class: 'bg-amber-50 text-amber-700 border-amber-200',
                      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
                    },
                    approved: {
                      label: 'Aprovado pelo RH',
                      class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
                    },
                    rejected: {
                      label: 'Não Aprovado',
                      class: 'bg-rose-50 text-rose-700 border-rose-200',
                      icon: <BadgeAlert className="w-3.5 h-3.5 text-rose-500" />,
                    },
                  };

                  const badge = statusBadges[adj.status];

                  return (
                    <div
                      key={adj.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {formatDateBR(adj.date)}
                          </span>
                          <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                            {adj.requestedTime}
                          </span>
                          <span className="text-slate-500 font-medium">
                            • {getPunchTypeLabel(adj.punchType)}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${badge.class}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-slate-700">{adj.description}</p>

                      {adj.attachmentName && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Anexo: {adj.attachmentName}</span>
                        </div>
                      )}

                      {adj.reviewerNotes && (
                        <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-600 mt-2">
                          <span className="font-semibold text-slate-700 block">Parecer do RH:</span>
                          {adj.reviewerNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
