import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileText,
  Sliders,
  Sparkles,
  BarChart3,
  Calendar,
  Building,
  CheckCircle2,
  X,
  ChevronRight,
  Tablet,
  ShieldCheck,
  History,
  KeyRound,
  Lock,
  Unlock,
  Settings,
  Wifi,
  WifiOff,
  CloudUpload,
  Database,
} from 'lucide-react';
import { Company, Employee, PunchRecord, AdjustmentRequest, AuditLog } from '../../types';
import { StorageService } from '../../services/storage';
import { OfflineSyncService } from '../../services/offlineSyncService';
import { IndexedDBService } from '../../services/indexedDB';
import {
  formatDateBR,
  formatMinutesToHours,
  formatCNPJ,
  calculateMinutesBetweenTimes,
} from '../../utils/formatters';
import { EmployeeList } from './EmployeeList';
import { EmployeeModal } from './EmployeeModal';
import { AttendanceManagement } from './AttendanceManagement';
import { TimeBankManagement } from './TimeBankManagement';
import { ReportsManagement } from './ReportsManagement';
import { WorkSchedulesManagement } from './WorkSchedulesManagement';
import { AuditTrailView } from './AuditTrailView';
import { EmployeeTimecard } from '../employee/EmployeeTimecard';
import { OfflineTestLabModal } from '../common/OfflineTestLabModal';

interface CompanyDashboardProps {
  company: Company;
  onOpenTerminal: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  company,
  onOpenTerminal,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'employees' | 'attendance' | 'schedules' | 'timebank' | 'reports' | 'audit'
  >('overview');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [punches, setPunches] = useState<PunchRecord[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Employee creation/edit modal state
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  // Timecard inspect modal for a specific employee
  const [inspectEmployee, setInspectEmployee] = useState<Employee | null>(null);

  // Kiosk Terminal exit password configuration modal
  const [kioskConfigModalOpen, setKioskConfigModalOpen] = useState(false);
  const [kioskPasswordInput, setKioskPasswordInput] = useState(company.kioskPassword || '1234');

  // Offline test lab modal state & real-time sync metrics
  const [testLabModalOpen, setTestLabModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const loadData = () => {
    const emps = StorageService.getEmployees(company.id);
    const puncs = StorageService.getPunches(company.id);
    const adjs = StorageService.getAdjustments(company.id);
    const logs = StorageService.getAuditLogs(company.id);
    setEmployees(emps);
    setPunches(puncs);
    setAdjustments(adjs);
    setAuditLogs(logs);

    IndexedDBService.getPendingCount(company.id)
      .then((count) => setPendingOfflineCount(count))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time offline sync manager updates
    const unsubscribe = OfflineSyncService.subscribe((event) => {
      setIsOnline(event.isOnline);
      setPendingOfflineCount(event.pendingCount);
      if (event.type === 'sync_success' || event.historyEntry) {
        setLastSyncTime(event.historyEntry?.timestamp || new Date().toISOString());
        const puncs = StorageService.getPunches(company.id);
        setPunches(puncs);
      }
    });

    return () => unsubscribe();
  }, [company.id]);

  // Compute Today's KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPunches = punches.filter((p) => p.date === todayStr);

  const clockedInEmployeeIds = new Set(
    todayPunches.filter((p) => p.type === 'entry').map((p) => p.employeeId)
  );

  const clockedOutEmployeeIds = new Set(
    todayPunches.filter((p) => p.type === 'exit').map((p) => p.employeeId)
  );

  const currentlyPresentEmployees = employees.filter(
    (e) => clockedInEmployeeIds.has(e.id) && !clockedOutEmployeeIds.has(e.id) && e.status === 'active'
  );

  const absentEmployees = employees.filter(
    (e) => !clockedInEmployeeIds.has(e.id) && e.status === 'active'
  );

  const todayDelays = todayPunches.filter((p) => {
    if (p.type !== 'entry') return false;
    const [h, m] = p.time.split(':').map(Number);
    return (h === 8 && m > 10) || h > 8;
  });

  const totalTimeBankMinutes = employees.reduce((acc, cur) => acc + cur.timeBankMinutes, 0);

  const currentMonthPrefix = todayStr.slice(0, 7);
  const monthPunches = punches.filter((p) => p.date.startsWith(currentMonthPrefix));

  let totalMonthWorkedMinutes = 0;
  employees.forEach((emp) => {
    const empMonthPunches = monthPunches.filter((p) => p.employeeId === emp.id);
    const dateMap = new Map<string, PunchRecord[]>();
    empMonthPunches.forEach((p) => {
      const arr = dateMap.get(p.date) || [];
      arr.push(p);
      dateMap.set(p.date, arr);
    });
    dateMap.forEach((dayPunches) => {
      dayPunches.sort((a, b) => a.timestamp - b.timestamp);
      const entry = dayPunches.find((p) => p.type === 'entry');
      const lunchOut = dayPunches.find((p) => p.type === 'lunch_start');
      const lunchIn = dayPunches.find((p) => p.type === 'lunch_end');
      const exit = dayPunches.find((p) => p.type === 'exit');
      if (entry && lunchOut) totalMonthWorkedMinutes += calculateMinutesBetweenTimes(entry.time, lunchOut.time);
      if (lunchIn && exit) totalMonthWorkedMinutes += calculateMinutesBetweenTimes(lunchIn.time, exit.time);
      else if (!lunchOut && !lunchIn && entry && exit) totalMonthWorkedMinutes += calculateMinutesBetweenTimes(entry.time, exit.time);
    });
  });

  const pendingAdjustmentsCount = adjustments.filter((a) => a.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Header: Company Info + Primary Kiosk Launch Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {company.tradeName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              CNPJ: {formatCNPJ(company.cnpj)}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
              Plano {company.plan}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Painel do Administrador • Gestão de Marcações, Códigos PIN, Escalas e Auditoria
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {/* Prominent Kiosk Terminal Launcher Button */}
          <button
            onClick={onOpenTerminal}
            className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2"
            title="Abrir a tela do celular ou tablet fixo da empresa"
          >
            <Tablet className="w-4 h-4" />
            <span>Abrir Terminal de Ponto (Tablet da Empresa)</span>
          </button>

          {/* Test Lab Simulator Button */}
          <button
            onClick={() => setTestLabModalOpen(true)}
            className="px-3.5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all flex items-center gap-2 shadow-xs"
            title="Abrir o Simulador Interativo de Queda de Conexão e Sincronização IndexedDB"
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Laboratório de Teste Offline</span>
          </button>

          <button
            onClick={() => {
              setEmployeeToEdit(null);
              setEmployeeModalOpen(true);
            }}
            className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Cadastrar Funcionário</span>
          </button>
        </div>
      </div>

      {/* 6 Required KPI Cards: Total Funcionários, Presentes, Ausentes, Atrasos, Horas Trabalhadas, Banco de Horas */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Funcionários */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Equipe
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {employees.filter((e) => e.status !== 'terminated').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {employees.some((e) => e.status === 'terminated')
              ? `${employees.filter((e) => e.status === 'terminated').length} desligado(s) • Limite: ${company.maxEmployees} vidas`
              : `Limite: ${company.maxEmployees} vidas`}
          </p>
        </div>

        {/* 2. Funcionários Presentes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Presentes
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <p className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
              {currentlyPresentEmployees.length}
            </p>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Em atividade no terminal</p>
        </div>

        {/* 3. Funcionários Ausentes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ausentes
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <UserX className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-700 mt-2 font-mono">
            {absentEmployees.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sem batida hoje</p>
        </div>

        {/* 4. Atrasos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Atrasos
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-2 font-mono">
            {todayDelays.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Tolerância excedida</p>
        </div>

        {/* 5. Horas Trabalhadas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Horas do Mês
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-2 font-mono truncate">
            {formatMinutesToHours(totalMonthWorkedMinutes)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Acumulado do mês</p>
        </div>

        {/* 6. Banco de Horas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Banco Horas
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p
            className={`text-lg sm:text-xl font-black mt-2 font-mono truncate ${
              totalTimeBankMinutes >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatMinutesToHours(totalTimeBankMinutes, true)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Saldo da empresa</p>
        </div>
      </div>

      {/* Navigation Tabs for Administrator */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {[
          { key: 'overview', label: 'Visão Geral & Tempo Real', icon: BarChart3 },
          { key: 'employees', label: 'Funcionários & Códigos PIN', icon: Users },
          {
            key: 'attendance',
            label: 'Marcações & Ajustes',
            icon: Clock,
            badge: pendingAdjustmentsCount > 0 ? pendingAdjustmentsCount : undefined,
          },
          { key: 'schedules', label: 'Jornadas & Horários', icon: Calendar },
          { key: 'timebank', label: 'Banco de Horas', icon: Sliders },
          { key: 'reports', label: 'Relatórios Mensais', icon: FileText },
          { key: 'audit', label: 'Histórico & Auditoria', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Who is working now & Status of employees */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Status da Equipe Hoje ({formatDateBR(todayStr)})
                </h3>
                <p className="text-xs text-slate-500">
                  Marcações registradas no terminal da empresa
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Tempo Real
              </span>
            </div>

            <div className="space-y-2.5">
              {employees.map((emp) => {
                const empTodayPunches = todayPunches.filter((p) => p.employeeId === emp.id);
                const isClockedIn = clockedInEmployeeIds.has(emp.id);
                const isFinished = clockedOutEmployeeIds.has(emp.id);
                const lastPunch = empTodayPunches[empTodayPunches.length - 1];

                let statusBadge = (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    Ausente / Sem Batida
                  </span>
                );

                if (emp.status === 'terminated') {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Demitido / Desligado
                    </span>
                  );
                } else if (emp.status === 'vacation') {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Em Férias
                    </span>
                  );
                } else if (isFinished) {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      Jornada Finalizada ({lastPunch?.time})
                    </span>
                  );
                } else if (lastPunch?.type === 'lunch_start') {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Em Intervalo ({lastPunch.time})
                    </span>
                  );
                } else if (isClockedIn) {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Presente (Entrada: {empTodayPunches[0]?.time})
                    </span>
                  );
                }

                return (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 flex items-center justify-center">
                        {emp.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                            PIN: {emp.pinCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {emp.role} • {emp.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {statusBadge}
                      <button
                        onClick={() => setInspectEmployee(emp)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                        title="Ver Espelho do Colaborador"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Dedicated Physical Terminal Card & Shortcuts */}
          <div className="lg:col-span-5 space-y-6">
            {/* Dedicated Terminal Quiosque Card */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-6 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Tablet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Terminal Físico da Empresa</h4>
                    <p className="text-[11px] text-emerald-300">
                      {company.terminalName || 'Tablet Recepção'} ({company.terminalDeviceCode || 'TER-01'})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setKioskPasswordInput(company.kioskPassword || '1234');
                    setKioskConfigModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                  title="Configurar senha de saída do quiosque"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configurar Senha</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Este é o aplicativo que fica fixo no celular ou tablet na parede da empresa. Os colaboradores digitam seu código PIN individual (ex: <strong>Claudilene digita 2222</strong>) para registrar a presença sem usar aparelhos pessoais.
              </p>

              {/* Security & Offline status indicators */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" /> Senha Quiosque:
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {company.kioskPassword || '1234'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    {isOnline ? (
                      <Wifi className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-rose-400" />
                    )}
                    Conexão:
                  </span>
                  <span className={`font-bold flex items-center gap-1.5 ${isOnline ? 'text-emerald-300' : 'text-rose-300'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {isOnline ? 'Online (Nuvem)' : 'Offline (Local)'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Database className="w-3 h-3 text-teal-400" /> Motor Offline:
                  </span>
                  <span className="font-bold text-teal-300">
                    IndexedDB Ativo
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <CloudUpload className="w-3 h-3 text-indigo-400" /> Última Sincronização:
                  </span>
                  <span className="font-mono font-semibold text-slate-200">
                    {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                  </span>
                </div>
              </div>

              {(pendingOfflineCount > 0 || punches.some((p) => p.syncStatus === 'pending_sync')) && (
                <div className="p-3 rounded-2xl bg-amber-950/70 border border-amber-600/60 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-xs">
                  <span className="flex items-center gap-2 text-[11px]">
                    <WifiOff className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                    <span>
                      <strong>{pendingOfflineCount || punches.filter((p) => p.syncStatus === 'pending_sync').length}</strong> marcação(ões) pendente(s) de sincronização no IndexedDB do terminal
                    </span>
                  </span>
                  <button
                    onClick={async () => {
                      const res = await OfflineSyncService.syncPendingPunches(company.id);
                      loadData();
                      if (res.syncedCount > 0) {
                        onShowToast('success', 'Sincronizado!', `${res.syncedCount} marcação(ões) offline enviadas ao Supabase.`);
                      } else {
                        onShowToast('info', 'Status Atualizado', 'Nenhuma marcação pendente no momento.');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shrink-0 transition-colors"
                  >
                    Sincronizar Agora
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={onOpenTerminal}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Tablet className="w-4 h-4" />
                  <span>Iniciar Modo Quiosque</span>
                </button>
                <button
                  onClick={() => setTestLabModalOpen(true)}
                  className="py-3 px-3.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-xl font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  title="Simular queda de internet e testar fila IndexedDB"
                >
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Testar Queda & Sincronização</span>
                </button>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Ações Administrativas</h3>
              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <button
                  onClick={() => setActiveTab('employees')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 border border-slate-200 transition-all text-left flex items-center justify-between font-semibold text-slate-700 group"
                >
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>Gerenciar Códigos PIN dos Funcionários</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveTab('schedules')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 border border-slate-200 transition-all text-left flex items-center justify-between font-semibold text-slate-700 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Cadastrar Jornadas e Escalas</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 border border-slate-200 transition-all text-left flex items-center justify-between font-semibold text-slate-700 group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Exportar Relatórios (Excel e PDF)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <EmployeeList
          company={company}
          employees={employees}
          onAddEmployee={() => {
            setEmployeeToEdit(null);
            setEmployeeModalOpen(true);
          }}
          onEditEmployee={(emp) => {
            setEmployeeToEdit(emp);
            setEmployeeModalOpen(true);
          }}
          onViewEmployeeTimecard={(emp) => {
            setInspectEmployee(emp);
          }}
          onUpdatePin={(empId, newPin) => {
            StorageService.updateEmployeePin(empId, newPin, 'Mariana Castro (RH)', 'mariana@techsolucoes.com.br');
            loadData();
            onShowToast('success', 'Código Atualizado', 'Novo código de acesso configurado e registrado na auditoria.');
          }}
          onToggleBlockPin={(empId, block) => {
            StorageService.toggleBlockPin(empId, block, 'Mariana Castro (RH)', 'mariana@techsolucoes.com.br');
            loadData();
            onShowToast(
              block ? 'info' : 'success',
              block ? 'Código Bloqueado' : 'Código Desbloqueado',
              'Ação gravada na trilha de auditoria.'
            );
          }}
          onDeleteEmployee={(empId) => {
            const emp = StorageService.getEmployeeById(empId);
            StorageService.deleteEmployee(empId);
            loadData();
            onShowToast(
              'info',
              'Colaborador Apagado',
              `O cadastro de ${emp?.name || 'colaborador'} foi excluído definitivamente do sistema.`
            );
          }}
          onTerminateEmployee={(empId, reason, date) => {
            const emp = StorageService.getEmployeeById(empId);
            StorageService.terminateEmployee(empId, reason, date);
            loadData();
            onShowToast(
              'info',
              'Colaborador Demitido / Desligado',
              `${emp?.name || 'Colaborador'} foi desligado e o acesso ao terminal foi bloqueado.`
            );
          }}
          onReactivateEmployee={(empId) => {
            const emp = StorageService.getEmployeeById(empId);
            StorageService.reactivateEmployee(empId);
            loadData();
            onShowToast(
              'success',
              'Colaborador Reativado',
              `${emp?.name || 'Colaborador'} foi reativado no quadro de funcionários ativos.`
            );
          }}
        />
      )}

      {activeTab === 'attendance' && (
        <AttendanceManagement
          company={company}
          employees={employees}
          punches={punches}
          adjustments={adjustments}
          onRefresh={loadData}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'schedules' && (
        <WorkSchedulesManagement
          company={company}
          employees={employees}
          onRefresh={loadData}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'timebank' && (
        <TimeBankManagement
          company={company}
          employees={employees}
          onRefresh={loadData}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsManagement
          company={company}
          employees={employees}
          punches={punches}
        />
      )}

      {activeTab === 'audit' && (
        <AuditTrailView
          company={company}
          logs={auditLogs}
        />
      )}

      {/* Employee Modal */}
      <EmployeeModal
        company={company}
        employeeToEdit={employeeToEdit}
        isOpen={employeeModalOpen}
        onClose={() => setEmployeeModalOpen(false)}
        onSave={(saved) => {
          StorageService.saveEmployee(saved);
          StorageService.addAuditLog({
            companyId: company.id,
            employeeId: saved.id,
            employeeName: saved.name,
            action: employeeToEdit ? 'employee_edit' : 'employee_create',
            details: `${employeeToEdit ? 'Edição cadastral' : 'Novo cadastro'} de funcionário: ${saved.name} (${saved.role})`,
            adminName: 'Mariana Castro (RH)',
            adminEmail: 'mariana@techsolucoes.com.br',
          });
          loadData();
          onShowToast(
            'success',
            'Colaborador Salvo',
            `${saved.name} foi ${employeeToEdit ? 'atualizado' : 'cadastrado'} com sucesso!`
          );
        }}
      />

      {/* Inspect Individual Employee Timecard Modal */}
      {inspectEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-50 rounded-3xl max-w-5xl w-full p-6 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Espelho Individual: {inspectEmployee.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectEmployee.role} • Matrícula {inspectEmployee.registrationNumber} • PIN: {inspectEmployee.pinCode}
                </p>
              </div>
              <button
                onClick={() => setInspectEmployee(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <EmployeeTimecard
              employee={inspectEmployee}
              company={company}
              punches={punches}
              adjustments={adjustments}
              onOpenAdjustmentModal={() => {
                setActiveTab('attendance');
                setInspectEmployee(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal para Configurar Senha de Saída do Modo Quiosque */}
      {kioskConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Senha de Saída do Quiosque
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Controle de acesso exclusivo do administrador
                  </p>
                </div>
              </div>
              <button
                onClick={() => setKioskConfigModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para impedir que os funcionários fechem a tela de ponto ou acessem o painel administrativo da empresa no celular/tablet corporativo, o modo quiosque é protegido por uma senha.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!kioskPasswordInput.trim()) {
                  alert('A senha não pode ser vazia.');
                  return;
                }
                StorageService.updateKioskPassword(
                  company.id,
                  kioskPasswordInput.trim(),
                  'Mariana Castro (RH)',
                  'mariana@techsolucoes.com.br'
                );
                loadData();
                setKioskConfigModalOpen(false);
                onShowToast(
                  'success',
                  'Senha do Quiosque Atualizada!',
                  'A nova senha já está ativa para desbloquear o terminal na empresa.'
                );
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nova Senha Administrativa do Quiosque
                </label>
                <input
                  type="text"
                  required
                  value={kioskPasswordInput}
                  onChange={(e) => setKioskPasswordInput(e.target.value)}
                  placeholder="Ex: 1234 ou 8921"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-base font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Sugestão: 4 a 6 dígitos numéricos fáceis de memorizar pelo gestor da empresa.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Segurança Garantida (Portaria 671 MTE):</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Colaboradores não conseguem desativar o terminal sem essa senha. Ao bater o ponto, o sistema emite o comprovante digital e retorna automaticamente à tela de espera.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setKioskConfigModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Offline Test Lab Modal (Simulador de Queda de Rede e Sincronização) */}
      <OfflineTestLabModal
        company={company}
        isOpen={testLabModalOpen}
        onClose={() => {
          setTestLabModalOpen(false);
          loadData();
        }}
        onRefreshData={loadData}
        onShowToast={onShowToast}
      />
    </div>
  );
};
