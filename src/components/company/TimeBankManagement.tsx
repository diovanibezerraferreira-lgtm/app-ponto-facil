import React, { useState } from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  ArrowUpDown,
  Download,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { Employee, Company } from '../../types';
import { StorageService } from '../../services/storage';
import { formatMinutesToHours, formatCPF } from '../../utils/formatters';

interface TimeBankManagementProps {
  company: Company;
  employees: Employee[];
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const TimeBankManagement: React.FC<TimeBankManagementProps> = ({
  company,
  employees,
  onRefresh,
  onShowToast,
}) => {
  const [selectedEmployeeForAdjust, setSelectedEmployeeForAdjust] = useState<Employee | null>(null);
  const [adjustMinutes, setAdjustMinutes] = useState('0');
  const [adjustReason, setAdjustReason] = useState('');

  // Calculate totals
  const totalPositiveMinutes = employees
    .filter((e) => e.timeBankMinutes > 0)
    .reduce((acc, cur) => acc + cur.timeBankMinutes, 0);

  const totalNegativeMinutes = employees
    .filter((e) => e.timeBankMinutes < 0)
    .reduce((acc, cur) => acc + Math.abs(cur.timeBankMinutes), 0);

  const netBalanceMinutes = totalPositiveMinutes - totalNegativeMinutes;

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForAdjust) return;

    const added = parseInt(adjustMinutes, 10);
    const newTotal = selectedEmployeeForAdjust.timeBankMinutes + added;
    StorageService.updateEmployeeTimeBank(selectedEmployeeForAdjust.id, newTotal);

    onRefresh();
    setSelectedEmployeeForAdjust(null);
    setAdjustMinutes('0');
    setAdjustReason('');
    onShowToast('success', 'Saldo Ajustado', 'O banco de horas do colaborador foi atualizado.');
  };

  const handleExportCsv = () => {
    const headers = 'Colaborador;CPF;Matrícula;Departamento;Saldo Banco de Horas (Minutos);Saldo Formatado\n';
    const rows = employees
      .map(
        (e) =>
          `"${e.name}";"${e.cpf}";"${e.registrationNumber}";"${e.department}";${e.timeBankMinutes};"${formatMinutesToHours(e.timeBankMinutes, true)}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banco_de_horas_${company.tradeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo Líquido da Empresa
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-mono font-black mt-2 ${
              netBalanceMinutes >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatMinutesToHours(netBalanceMinutes, true)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Balanço consolidado de todos os colaboradores ativos
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Horas Extras Acumuladas
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-emerald-600 mt-2">
            +{formatMinutesToHours(totalPositiveMinutes)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Créditos a serem compensados ou pagos
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Horas Devidas (Débitos)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-rose-600 mt-2">
            -{formatMinutesToHours(totalNegativeMinutes)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Atrasos e saídas antecipadas a compensar
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Extrato Individual de Banco de Horas</h3>
            <p className="text-xs text-slate-500">
              Controle de compensação conforme Art. 59 § 2º e § 5º da CLT (Acordo Individual ou Coletivo).
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-3">Departamento</th>
                <th className="py-3 px-3 text-center">Saldo Atual</th>
                <th className="py-3 px-3">Balanço Visual</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const isPositive = emp.timeBankMinutes >= 0;
                const barWidth = Math.min(100, (Math.abs(emp.timeBankMinutes) / 600) * 100);

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{emp.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {emp.registrationNumber} • {formatCPF(emp.cpf)}
                      </p>
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-medium">{emp.department}</td>

                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {formatMinutesToHours(emp.timeBankMinutes, true)}
                      </span>
                    </td>

                    <td className="py-3 px-3 w-48">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${barWidth || 5}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmployeeForAdjust(emp)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ajustar / Compensar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {selectedEmployeeForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Ajustar Banco de Horas: {selectedEmployeeForAdjust.name}
            </h3>
            <p className="text-slate-500">
              Saldo Atual:{' '}
              <span className="font-mono font-bold text-slate-800">
                {formatMinutesToHours(selectedEmployeeForAdjust.timeBankMinutes, true)}
              </span>
            </p>

            <form onSubmit={handleApplyAdjustment} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minutos a adicionar ou abater (use número negativo para abater)
                </label>
                <input
                  type="number"
                  step="15"
                  required
                  value={adjustMinutes}
                  onChange={(e) => setAdjustMinutes(e.target.value)}
                  placeholder="Ex: 60 para somar 1h ou -60 para descontar 1h"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Equivale a: {formatMinutesToHours(parseInt(adjustMinutes || '0', 10), true)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo da Compensação / Ajuste
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ex: Folga compensatória concedida ou pagamento de horas extras em folha."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeForAdjust(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs"
                >
                  Salvar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
