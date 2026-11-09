import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  Building,
  Users,
  CloudUpload,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { Employee, PunchRecord, Company } from '../../types';
import {
  formatDateBR,
  formatMinutesToHours,
  formatCPF,
  formatCNPJ,
  calculateMinutesBetweenTimes,
} from '../../utils/formatters';

interface ReportsManagementProps {
  company: Company;
  employees: Employee[];
  punches: PunchRecord[];
}

export const ReportsManagement: React.FC<ReportsManagementProps> = ({
  company,
  employees,
  punches,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('11'); // November
  const [selectedYear, setSelectedYear] = useState('2026');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const filteredEmployees = employees.filter(
    (e) => departmentFilter === 'ALL' || e.department === departmentFilter
  );

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  // Calculate monthly stats per employee
  const employeeStats = filteredEmployees.map((emp) => {
    // Filter punches in this month/year for this employee
    const empPunches = punches.filter((p) => {
      if (p.employeeId !== emp.id) return false;
      const [y, m] = p.date.split('-');
      return y === selectedYear && m === selectedMonth.padStart(2, '0');
    });

    // Group by date
    const dateMap = new Map<string, PunchRecord[]>();
    empPunches.forEach((p) => {
      const arr = dateMap.get(p.date) || [];
      arr.push(p);
      dateMap.set(p.date, arr);
    });

    let workedMinutes = 0;
    let daysPresent = 0;
    let lateCount = 0;

    dateMap.forEach((dayPunches, dStr) => {
      daysPresent++;
      dayPunches.sort((a, b) => a.timestamp - b.timestamp);
      const entry = dayPunches.find((p) => p.type === 'entry');
      const lunchOut = dayPunches.find((p) => p.type === 'lunch_start');
      const lunchIn = dayPunches.find((p) => p.type === 'lunch_end');
      const exit = dayPunches.find((p) => p.type === 'exit');

      if (entry && lunchOut) {
        workedMinutes += calculateMinutesBetweenTimes(entry.time, lunchOut.time);
      }
      if (lunchIn && exit) {
        workedMinutes += calculateMinutesBetweenTimes(lunchIn.time, exit.time);
      } else if (!lunchOut && !lunchIn && entry && exit) {
        workedMinutes += calculateMinutesBetweenTimes(entry.time, exit.time);
      }

      // Check for delays (> 10 min late)
      if (entry) {
        const [h, m] = entry.time.split(':').map(Number);
        if (h === 8 && m > 10) lateCount++;
        if (h > 8) lateCount++;
      }
    });

    // Expected hours calculation (approx 21 business days)
    const expectedMinutes = Math.round(21 * emp.dailyTargetMinutes);
    const balance = workedMinutes - expectedMinutes;

    return {
      employee: emp,
      workedMinutes,
      expectedMinutes,
      balance,
      daysPresent,
      lateCount,
    };
  });

  const handleExportCsv = () => {
    const headers =
      'Empresa;CNPJ;MesAno;Colaborador;CPF;Matricula;Cargo;DiasTrabalhados;HorasTrabalhadas;HorasEsperadas;SaldoMes;Atrasos\n';
    const rows = employeeStats
      .map(
        (st) =>
          `"${company.tradeName}";"${company.cnpj}";"${selectedMonth}/${selectedYear}";"${st.employee.name}";"${st.employee.cpf}";"${st.employee.registrationNumber}";"${st.employee.role}";${st.daysPresent};"${formatMinutesToHours(st.workedMinutes)}";"${formatMinutesToHours(st.expectedMinutes)}";"${formatMinutesToHours(st.balance, true)}";${st.lateCount}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_mensal_ponto_${selectedMonth}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Mês de Referência:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Ano:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Departamento:</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
            >
              <option value="ALL">Todos os Setores</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Folha (CSV)</span>
          </button>
        </div>
      </div>

      {/* Offline Sync Status & Legal Compliance Note */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <CloudUpload className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <div>
            <p className="font-bold text-emerald-950">
              Sincronização Automática com o Terminal do Tablet
            </p>
            <p className="text-[11px] text-emerald-800">
              Marcações registradas no aparelho da empresa sem internet são sincronizadas e computadas integralmente neste relatório assim que a conexão retorna, preservando o horário exato da batida (Portaria 671 MTE).
            </p>
          </div>
        </div>
        {punches.some((p) => p.syncStatus === 'pending_sync') && (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px] whitespace-nowrap animate-pulse flex items-center gap-1 self-start sm:self-auto">
            <WifiOff className="w-3 h-3 text-amber-700" />
            <span>{punches.filter((p) => p.syncStatus === 'pending_sync').length} pendente(s) de conexão no tablet</span>
          </span>
        )}
      </div>

      {/* Printable Report Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 print:border-none print:p-0">
        {/* Report Header for printing */}
        <div className="pb-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-extrabold text-slate-900">{company.legalName}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              CNPJ: {formatCNPJ(company.cnpj)} • {company.city} - {company.state}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Relatório Consolidado de Ponto Eletrônico
            </span>
            <span className="text-sm font-black text-slate-900">
              Período: {selectedMonth}/{selectedYear}
            </span>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Colaborador</th>
                <th className="py-3 px-2">Cargo / Função</th>
                <th className="py-3 px-2 text-center">Dias Registrados</th>
                <th className="py-3 px-2 text-center">Horas Trab.</th>
                <th className="py-3 px-2 text-center">Carga Prevista</th>
                <th className="py-3 px-2 text-center">Saldo Período</th>
                <th className="py-3 px-2 text-center">Atrasos</th>
                <th className="py-3 px-3 text-right">Banco Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeStats.map(({ employee, workedMinutes, expectedMinutes, balance, daysPresent, lateCount }) => (
                <tr key={employee.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{employee.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {employee.registrationNumber} • {formatCPF(employee.cpf)}
                    </p>
                  </td>

                  <td className="py-3 px-2 text-slate-700">{employee.role}</td>

                  <td className="py-3 px-2 text-center font-mono font-medium text-slate-800">
                    {daysPresent} dias
                  </td>

                  <td className="py-3 px-2 text-center font-mono font-bold text-slate-900">
                    {formatMinutesToHours(workedMinutes)}
                  </td>

                  <td className="py-3 px-2 text-center font-mono text-slate-500">
                    {formatMinutesToHours(expectedMinutes)}
                  </td>

                  <td className="py-3 px-2 text-center font-mono font-bold">
                    <span className={balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {formatMinutesToHours(balance, true)}
                    </span>
                  </td>

                  <td className="py-3 px-2 text-center font-mono">
                    {lateCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[11px]">
                        {lateCount}x
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-black">
                    <span
                      className={
                        employee.timeBankMinutes >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }
                    >
                      {formatMinutesToHours(employee.timeBankMinutes, true)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Documento gerado pelo sistema Ponto Fácil • Emissão em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
          <div className="flex items-center gap-4">
            <span className="border-t border-slate-400 pt-1 px-8 text-center text-slate-600">
              Assinatura do Responsável RH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
