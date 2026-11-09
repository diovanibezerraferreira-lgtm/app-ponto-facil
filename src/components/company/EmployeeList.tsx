import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Edit2,
  FileText,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  UserMinus,
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  Calendar,
} from 'lucide-react';
import { Employee, Company } from '../../types';
import { formatDateBR, formatMinutesToHours } from '../../utils/formatters';
import { PinManagementModal } from './PinManagementModal';

interface EmployeeListProps {
  company: Company;
  employees: Employee[];
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onViewEmployeeTimecard: (employee: Employee) => void;
  onUpdatePin: (employeeId: string, newPin: string) => void;
  onToggleBlockPin: (employeeId: string, block: boolean) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onTerminateEmployee: (employeeId: string, reason: string, date: string) => void;
  onReactivateEmployee: (employeeId: string) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  company,
  employees,
  onAddEmployee,
  onEditEmployee,
  onViewEmployeeTimecard,
  onUpdatePin,
  onToggleBlockPin,
  onDeleteEmployee,
  onTerminateEmployee,
  onReactivateEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedEmpForPin, setSelectedEmpForPin] = useState<Employee | null>(null);

  // Modal states for Termination and Deletion
  const [employeeToTerminate, setEmployeeToTerminate] = useState<Employee | null>(null);
  const [terminationReason, setTerminationReason] = useState('Rescisão de contrato de trabalho');
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);

  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Filter employees
  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.cpf && emp.cpf.includes(searchTerm)) ||
      (emp.registrationNumber && emp.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.pinCode && emp.pinCode.includes(searchTerm));

    const matchesDept = selectedDepartment === 'ALL' || emp.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'ALL' || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department || 'Geral')));

  const statusLabels: Record<string, { text: string; class: string }> = {
    active: { text: 'Ativo', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    vacation: { text: 'Férias', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    leave: { text: 'Afastado', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    terminated: { text: 'Demitido / Desligado', class: 'bg-rose-50 text-rose-700 border-rose-300 font-bold' },
  };

  const handleConfirmTermination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToTerminate) return;
    onTerminateEmployee(
      employeeToTerminate.id,
      terminationReason.trim() || 'Desligamento de contrato',
      terminationDate
    );
    setEmployeeToTerminate(null);
  };

  const handleConfirmDeletion = () => {
    if (!employeeToDelete) return;
    onDeleteEmployee(employeeToDelete.id);
    setEmployeeToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Gestão de Colaboradores & Códigos de Ponto</h2>
          <p className="text-xs text-slate-500">
            {employees.filter((e) => e.status !== 'terminated').length} colaboradores ativos de{' '}
            {company.maxEmployees} disponíveis no plano{' '}
            <span className="uppercase font-semibold text-emerald-600">{company.plan}</span>.
            {employees.filter((e) => e.status === 'terminated').length > 0 && (
              <span className="ml-1 text-slate-400">
                ({employees.filter((e) => e.status === 'terminated').length} demitido(s))
              </span>
            )}
          </p>
        </div>

        <button
          onClick={onAddEmployee}
          className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Funcionário</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, código PIN (ex: 2222), cargo ou matrícula..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Todos os Departamentos</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="vacation">Férias</option>
            <option value="leave">Afastados</option>
            <option value="terminated">Demitidos / Desligados</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-3">Cargo / Departamento</th>
                <th className="py-3 px-3">Código Terminal (PIN)</th>
                <th className="py-3 px-3 text-center">Banco de Horas</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações (Demitir / Apagar)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => {
                const isTerminated = emp.status === 'terminated';
                const status = statusLabels[emp.status] || statusLabels.active;

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors ${
                      isTerminated ? 'bg-slate-50/60 opacity-75' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs ${
                            isTerminated
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-bold ${isTerminated ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                              {emp.name}
                            </p>
                            {isTerminated && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                                Desligado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {emp.email || 'Sem e-mail cadastrado'} • {emp.registrationNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{emp.role || 'Colaborador(a)'}</p>
                      <p className="text-[11px] text-slate-500">{emp.department || 'Geral'}</p>
                    </td>

                    {/* PIN Column */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEmpForPin(emp)}
                          disabled={isTerminated}
                          className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 transition-colors ${
                            isTerminated
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : emp.pinBlocked
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={isTerminated ? 'PIN desativado (demitido)' : 'Clique para gerenciar o código PIN'}
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                          <span>{emp.pinCode ? `PIN: ${emp.pinCode}` : 'Sem PIN'}</span>
                          {emp.pinBlocked && !isTerminated && (
                            <span className="text-[9px] text-rose-600 font-bold uppercase ml-1">
                              (Bloqueado)
                            </span>
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          emp.timeBankMinutes >= 0
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}
                      >
                        {formatMinutesToHours(emp.timeBankMinutes, true)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.class}`}
                        >
                          {status.text}
                        </span>
                        {isTerminated && emp.terminationDate && (
                          <span className="block text-[10px] text-slate-400">
                            em {formatDateBR(emp.terminationDate)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions Column: Timecard, Edit, Demitir / Reativar, Apagar */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver Espelho */}
                        <button
                          onClick={() => onViewEmployeeTimecard(emp)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Ver Espelho de Ponto Individual"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => onEditEmployee(emp)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Editar Dados do Colaborador"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Demitir / Reativar */}
                        {!isTerminated ? (
                          <button
                            onClick={() => {
                              setEmployeeToTerminate(emp);
                              setTerminationReason('Rescisão de contrato de trabalho');
                              setTerminationDate(new Date().toISOString().split('T')[0]);
                            }}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                            title="Demitir / Desligar Colaborador (Preserva histórico)"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onReactivateEmployee(emp.id)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                            title="Reativar Colaborador no Quadro Ativo"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Apagar Definitivamente */}
                        <button
                          onClick={() => setEmployeeToDelete(emp)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Apagar Colaborador Definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum colaborador encontrado com os filtros aplicados.
          </div>
        )}
      </div>

      {/* PIN Management Modal */}
      <PinManagementModal
        employee={selectedEmpForPin}
        isOpen={!!selectedEmpForPin}
        onClose={() => setSelectedEmpForPin(null)}
        onSavePin={(empId, newPin) => {
          onUpdatePin(empId, newPin);
          setSelectedEmpForPin(null);
        }}
        onToggleBlock={(empId, block) => {
          onToggleBlockPin(empId, block);
          setSelectedEmpForPin(null);
        }}
      />

      {/* MODAL 1: DEMITIR / DESLIGAR FUNCIONÁRIO */}
      {employeeToTerminate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Demitir / Desligar Funcionário</h3>
                  <p className="text-[11px] text-slate-500">{employeeToTerminate.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEmployeeToTerminate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ao confirmar a demissão/desligamento de <strong>{employeeToTerminate.name}</strong>, o acesso ao terminal de ponto será <strong>bloqueado imediatamente</strong>. Todo o histórico de marcações e espelhos de ponto permanecerá salvo no sistema para fins fiscais e de auditoria da CLT.
            </p>

            <form onSubmit={handleConfirmTermination} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data de Desligamento *
                </label>
                <input
                  type="date"
                  required
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo do Desligamento *
                </label>
                <select
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Rescisão de contrato de trabalho (Sem justa causa)">
                    Rescisão sem justa causa (pela empresa)
                  </option>
                  <option value="Pedido de demissão pelo colaborador">
                    Pedido de demissão pelo colaborador
                  </option>
                  <option value="Término de contrato de experiência / prazo determinado">
                    Término de experiência / prazo determinado
                  </option>
                  <option value="Acordo mútuo entre as partes (Art. 484-A CLT)">
                    Acordo mútuo (Art. 484-A CLT)
                  </option>
                  <option value="Rescisão com justa causa">
                    Rescisão com justa causa
                  </option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Conformidade Trabalhista (Portaria 671 MTE):
                </p>
                <p className="text-[11px] text-amber-800">
                  Os registros fiscais passados nunca são apagados na demissão, garantindo segurança jurídica para a empresa e o colaborador.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEmployeeToTerminate(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <UserMinus className="w-4 h-4" />
                  <span>Confirmar Demissão</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APAGAR FUNCIONÁRIO (EXCLUSÃO DEFINITIVA) */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Apagar Funcionário</h3>
                  <p className="text-[11px] text-slate-500">{employeeToDelete.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEmployeeToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Atenção: Exclusão Permanente</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Você está prestes a apagar o cadastro de <strong>{employeeToDelete.name}</strong> (Matrícula: {employeeToDelete.registrationNumber}, PIN: {employeeToDelete.pinCode}) do banco de dados.
              </p>
              <p className="text-[11px] text-rose-900 font-semibold leading-relaxed">
                Dica: Se o funcionário foi desligado da empresa, o recomendado por lei é utilizar a opção <strong>"Demitir / Desligar"</strong>, que bloqueia o terminal mas preserva a folha e os comprovantes digitais.
              </p>
            </div>

            <p className="text-xs text-slate-600">
              Deseja realmente apagar este colaborador? Esta ação será registrada na trilha de auditoria.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletion}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Apagar Colaborador</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
