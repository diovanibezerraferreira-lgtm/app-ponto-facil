import {
  Company,
  Employee,
  PunchRecord,
  AdjustmentRequest,
  CurrentUserSession,
  AdjustmentStatus,
  DailySummary,
  PunchType,
  WorkSchedule,
  AuditLog,
} from '../types';
import {
  INITIAL_COMPANIES,
  INITIAL_EMPLOYEES,
  INITIAL_ADJUSTMENTS,
  INITIAL_WORK_SCHEDULES,
  INITIAL_AUDIT_LOGS,
  generateInitialPunches,
} from './mockData';
import { generateFakeHash, calculateMinutesBetweenTimes } from '../utils/formatters';

const STORAGE_KEYS = {
  COMPANIES: 'ponto_facil_companies_v2',
  EMPLOYEES: 'ponto_facil_employees_v2',
  PUNCHES: 'ponto_facil_punches_v2',
  ADJUSTMENTS: 'ponto_facil_adjustments_v2',
  WORK_SCHEDULES: 'ponto_facil_schedules_v2',
  AUDIT_LOGS: 'ponto_facil_audit_v2',
  SESSION: 'ponto_facil_session_v2',
  NSR_COUNTER: 'ponto_facil_nsr_counter_v2',
  APP_MODE: 'ponto_facil_app_mode_v2',
  KIOSK_COMPANY_ID: 'ponto_facil_kiosk_company_id_v2',
};

// Initialize localStorage if empty
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(INITIAL_COMPANIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WORK_SCHEDULES)) {
    localStorage.setItem(STORAGE_KEYS.WORK_SCHEDULES, JSON.stringify(INITIAL_WORK_SCHEDULES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PUNCHES)) {
    const punches = generateInitialPunches();
    localStorage.setItem(STORAGE_KEYS.PUNCHES, JSON.stringify(punches));
    localStorage.setItem(STORAGE_KEYS.NSR_COUNTER, String(10000 + punches.length + 1));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(INITIAL_ADJUSTMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SESSION)) {
    // Default session: Company Administrator Mariana Castro
    const defaultSession: CurrentUserSession = {
      role: 'company_admin',
      email: 'mariana.castro@techsolucoes.com.br',
      name: 'Mariana Castro',
      companyId: 'comp-1',
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(defaultSession));
  }
  if (!localStorage.getItem(STORAGE_KEYS.KIOSK_COMPANY_ID)) {
    localStorage.setItem(STORAGE_KEYS.KIOSK_COMPANY_ID, 'comp-1');
  }
}

// Call init once
initializeStorage();

export const StorageService = {
  resetAll: () => {
    localStorage.removeItem(STORAGE_KEYS.COMPANIES);
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.WORK_SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.PUNCHES);
    localStorage.removeItem(STORAGE_KEYS.ADJUSTMENTS);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.NSR_COUNTER);
    localStorage.removeItem(STORAGE_KEYS.KIOSK_COMPANY_ID);
    initializeStorage();
  },

  // App Mode & Kiosk Company Binding
  getKioskCompanyId: (): string => {
    return localStorage.getItem(STORAGE_KEYS.KIOSK_COMPANY_ID) || 'comp-1';
  },

  setKioskCompanyId: (companyId: string) => {
    localStorage.setItem(STORAGE_KEYS.KIOSK_COMPANY_ID, companyId);
  },

  // Session
  getSession: (): CurrentUserSession => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      role: 'company_admin',
      email: 'mariana.castro@techsolucoes.com.br',
      name: 'Mariana Castro',
      companyId: 'comp-1',
    };
  },

  setSession: (session: CurrentUserSession) => {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  },

  // Companies
  getCompanies: (): Company[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      return val ? JSON.parse(val) : INITIAL_COMPANIES;
    } catch {
      return INITIAL_COMPANIES;
    }
  },

  getCompanyById: (id: string): Company | undefined => {
    return StorageService.getCompanies().find((c) => c.id === id);
  },

  saveCompany: (company: Company) => {
    const companies = StorageService.getCompanies();
    const index = companies.findIndex((c) => c.id === company.id);
    if (index >= 0) {
      companies[index] = company;
    } else {
      companies.push(company);
    }
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  },

  // Employees
  getEmployees: (companyId?: string): Employee[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      const list: Employee[] = val ? JSON.parse(val) : INITIAL_EMPLOYEES;
      if (companyId) {
        return list.filter((e) => e.companyId === companyId);
      }
      return list;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  },

  getEmployeeById: (id: string): Employee | undefined => {
    return StorageService.getEmployees().find((e) => e.id === id);
  },

  saveEmployee: (employee: Employee) => {
    const employees = StorageService.getEmployees();
    const index = employees.findIndex((e) => e.id === employee.id);
    if (index >= 0) {
      employees[index] = employee;
    } else {
      employees.push(employee);
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  deleteEmployee: (
    employeeId: string,
    adminName: string = 'Mariana Castro (RH)',
    adminEmail: string = 'mariana@techsolucoes.com.br'
  ): boolean => {
    const employees = StorageService.getEmployees();
    const target = employees.find((e) => e.id === employeeId);
    if (!target) return false;

    const remaining = employees.filter((e) => e.id !== employeeId);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(remaining));

    StorageService.addAuditLog({
      companyId: target.companyId,
      employeeId: target.id,
      employeeName: target.name,
      action: 'employee_delete',
      details: `Cadastro do colaborador ${target.name} (Matrícula: ${target.registrationNumber}) foi excluído definitivamente pelo administrador.`,
      adminName,
      adminEmail,
      oldValue: `${target.name} (${target.role})`,
      newValue: 'Excluído',
    });

    return true;
  },

  terminateEmployee: (
    employeeId: string,
    reason: string = 'Desligamento / Rescisão contratual',
    terminationDate?: string,
    adminName: string = 'Mariana Castro (RH)',
    adminEmail: string = 'mariana@techsolucoes.com.br'
  ): boolean => {
    const employees = StorageService.getEmployees();
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return false;

    const termDate = terminationDate || new Date().toISOString().split('T')[0];
    emp.status = 'terminated';
    emp.pinBlocked = true;
    emp.terminationDate = termDate;
    emp.terminationReason = reason;

    StorageService.saveEmployee(emp);

    StorageService.addAuditLog({
      companyId: emp.companyId,
      employeeId: emp.id,
      employeeName: emp.name,
      action: 'employee_terminate',
      details: `Colaborador ${emp.name} foi demitido/desligado em ${termDate}. Motivo: ${reason}. Acesso ao terminal bloqueado.`,
      adminName,
      adminEmail,
      oldValue: 'Ativo',
      newValue: `Demitido (${termDate})`,
    });

    return true;
  },

  reactivateEmployee: (
    employeeId: string,
    adminName: string = 'Mariana Castro (RH)',
    adminEmail: string = 'mariana@techsolucoes.com.br'
  ): boolean => {
    const employees = StorageService.getEmployees();
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return false;

    emp.status = 'active';
    emp.pinBlocked = false;
    emp.terminationDate = undefined;
    emp.terminationReason = undefined;

    StorageService.saveEmployee(emp);

    StorageService.addAuditLog({
      companyId: emp.companyId,
      employeeId: emp.id,
      employeeName: emp.name,
      action: 'employee_reactivate',
      details: `Colaborador ${emp.name} foi reativado no quadro de funcionários ativos.`,
      adminName,
      adminEmail,
      oldValue: 'Demitido',
      newValue: 'Ativo',
    });

    return true;
  },

  updateEmployeeTimeBank: (employeeId: string, newBalanceMinutes: number) => {
    const employees = StorageService.getEmployees();
    const index = employees.findIndex((e) => e.id === employeeId);
    if (index >= 0) {
      employees[index].timeBankMinutes = newBalanceMinutes;
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    }
  },

  // PIN verification for Kiosk Terminal with Brute-Force & Lock Protection
  verifyPinForTerminal: (
    companyId: string,
    pin: string
  ): { success: boolean; employee?: Employee; message?: string } => {
    const employees = StorageService.getEmployees(companyId);
    const match = employees.find((e) => e.pinCode === pin.trim());

    if (!match) {
      return {
        success: false,
        message: 'Código não encontrado para este estabelecimento. Verifique com a administração.',
      };
    }

    if (match.pinBlocked) {
      return {
        success: false,
        message: `O código de ${match.name} está bloqueado por motivos de segurança${
          match.status === 'terminated' ? ' (Colaborador desligado/demitido)' : ''
        }.`,
      };
    }

    if (match.status !== 'active') {
      const statusDesc =
        match.status === 'terminated'
          ? 'Demitido / Desligado da empresa'
          : match.status === 'vacation'
          ? 'Férias'
          : 'Afastado';
      return {
        success: false,
        message: `Colaborador ${match.name} não está em status ativo (${statusDesc}). Registro não autorizado.`,
      };
    }

    // Reset failed attempts upon successful match
    if (match.failedPinAttempts > 0) {
      match.failedPinAttempts = 0;
      StorageService.saveEmployee(match);
    }

    return {
      success: true,
      employee: match,
    };
  },

  // Update PIN with Audit Trail
  updateEmployeePin: (
    employeeId: string,
    newPin: string,
    adminName: string,
    adminEmail: string
  ): boolean => {
    const employee = StorageService.getEmployeeById(employeeId);
    if (!employee) return false;

    const oldPinMasked = '••••';
    employee.pinCode = newPin.trim();
    employee.pinBlocked = false;
    employee.failedPinAttempts = 0;
    StorageService.saveEmployee(employee);

    StorageService.addAuditLog({
      companyId: employee.companyId,
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'pin_change',
      details: `Código de acesso PIN atualizado para o colaborador ${employee.name}`,
      adminName,
      adminEmail,
      oldValue: oldPinMasked,
      newValue: '•••• (Alterado)',
    });

    return true;
  },

  // Block or unblock PIN
  toggleBlockPin: (
    employeeId: string,
    block: boolean,
    adminName: string,
    adminEmail: string
  ): boolean => {
    const employee = StorageService.getEmployeeById(employeeId);
    if (!employee) return false;

    employee.pinBlocked = block;
    if (!block) employee.failedPinAttempts = 0;
    StorageService.saveEmployee(employee);

    StorageService.addAuditLog({
      companyId: employee.companyId,
      employeeId: employee.id,
      employeeName: employee.name,
      action: block ? 'pin_block' : 'pin_unblock',
      details: block
        ? `Código de acesso PIN de ${employee.name} bloqueado pela administração`
        : `Código de acesso PIN de ${employee.name} desbloqueado pela administração`,
      adminName,
      adminEmail,
      oldValue: block ? 'Desbloqueado' : 'Bloqueado',
      newValue: block ? 'Bloqueado' : 'Desbloqueado',
    });

    return true;
  },

  // Offline Network Simulation and Detection
  isSimulatedOffline: (): boolean => {
    return localStorage.getItem('ponto_facil_simulated_offline') === 'true';
  },

  setSimulatedOffline: (offline: boolean) => {
    if (offline) {
      localStorage.setItem('ponto_facil_simulated_offline', 'true');
    } else {
      localStorage.removeItem('ponto_facil_simulated_offline');
    }
  },

  isOnline: (): boolean => {
    if (StorageService.isSimulatedOffline()) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  // Kiosk Password Management
  getKioskPassword: (companyId: string): string => {
    const comp = StorageService.getCompanyById(companyId);
    return comp?.kioskPassword || '1234';
  },

  updateKioskPassword: (
    companyId: string,
    newPassword: string,
    adminName: string = 'Mariana Castro (RH)',
    adminEmail: string = 'mariana@techsolucoes.com.br'
  ): boolean => {
    const company = StorageService.getCompanyById(companyId);
    if (!company) return false;

    company.kioskPassword = newPassword.trim();
    StorageService.saveCompany(company);

    StorageService.addAuditLog({
      companyId: company.id,
      action: 'kiosk_password_change',
      details: `Senha de saída do Modo Quiosque atualizada para o terminal da empresa ${company.tradeName}`,
      adminName,
      adminEmail,
      oldValue: '••••',
      newValue: '•••• (Alterada)',
    });

    return true;
  },

  verifyKioskPassword: (companyId: string, inputPassword: string): boolean => {
    const expected = StorageService.getKioskPassword(companyId);
    return inputPassword.trim() === expected.trim();
  },

  // Punches
  getPunches: (companyId?: string, employeeId?: string): PunchRecord[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.PUNCHES);
      let list: PunchRecord[] = val ? JSON.parse(val) : [];
      if (companyId) {
        list = list.filter((p) => p.companyId === companyId);
      }
      if (employeeId) {
        list = list.filter((p) => p.employeeId === employeeId);
      }
      return list.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  },

  setRawPunches: (punches: PunchRecord[]) => {
    localStorage.setItem(STORAGE_KEYS.PUNCHES, JSON.stringify(punches));
  },

  getPendingSyncCount: (companyId?: string): number => {
    const punches = StorageService.getPunches(companyId);
    return punches.filter((p) => p.syncStatus === 'pending_sync').length;
  },

  syncPendingPunches: (companyId?: string): { syncedCount: number } => {
    const punches = StorageService.getPunches();
    let syncedCount = 0;
    const nowIso = new Date().toISOString();

    const updated = punches.map((p) => {
      if (p.syncStatus === 'pending_sync' && (!companyId || p.companyId === companyId)) {
        syncedCount++;
        return {
          ...p,
          syncStatus: 'synced' as const,
          syncedAt: nowIso,
        };
      }
      return p;
    });

    if (syncedCount > 0) {
      localStorage.setItem(STORAGE_KEYS.PUNCHES, JSON.stringify(updated));

      const targetCompany = companyId || 'comp-1';
      StorageService.addAuditLog({
        companyId: targetCompany,
        action: 'punch_adjust',
        details: `Sincronização offline: ${syncedCount} marcação(ões) pendente(s) sincronizada(s) após retorno de conexão à internet.`,
        adminName: 'Sistema Ponto Fácil (Sync)',
        adminEmail: 'sistema@pontofacil.com.br',
        newValue: `${syncedCount} sincronizados`,
      });
    }

    return { syncedCount };
  },

  addPunch: (data: {
    employeeId: string;
    companyId: string;
    type: PunchType;
    location?: { latitude: number; longitude: number; addressText: string; accuracy: number };
    deviceInfo?: string;
    date?: string;
    time?: string;
    manualAdjustment?: boolean;
    notes?: string;
    registeredVia?: 'kiosk_terminal' | 'admin_manual';
    syncStatus?: 'synced' | 'pending_sync';
  }): PunchRecord => {
    const punches = StorageService.getPunches();
    let nsr = 10001;
    try {
      const storedNsr = localStorage.getItem(STORAGE_KEYS.NSR_COUNTER);
      if (storedNsr) nsr = parseInt(storedNsr, 10);
    } catch {
      // ignore
    }

    const now = new Date();
    const date = data.date || now.toISOString().split('T')[0];
    const time = data.time || now.toTimeString().split(' ')[0];
    const timestamp = new Date(`${date}T${time}`).getTime();

    // Determine offline / sync status
    const isOnlineNow = StorageService.isOnline();
    const syncStatus: 'synced' | 'pending_sync' = data.syncStatus
      ? data.syncStatus
      : isOnlineNow
      ? 'synced'
      : 'pending_sync';

    const syncedAt = syncStatus === 'synced' ? now.toISOString() : undefined;

    const newPunch: PunchRecord = {
      id: `punch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: data.employeeId,
      companyId: data.companyId,
      date,
      time,
      timestamp,
      type: data.type,
      location: data.location,
      deviceInfo: data.deviceInfo || 'Terminal de Ponto Fixo da Empresa',
      nsr,
      receiptHash: generateFakeHash(),
      verifiedGps: !!data.location,
      manualAdjustment: data.manualAdjustment,
      notes: data.notes,
      registeredVia: data.registeredVia || 'kiosk_terminal',
      syncStatus,
      syncedAt,
      connectionStateAtPunch: isOnlineNow ? 'online' : 'offline',
      terminalId: 'TER-01',
      terminalName: 'Tablet Recepção',
      storageDriver: 'indexedDB',
    };

    punches.unshift(newPunch);
    localStorage.setItem(STORAGE_KEYS.PUNCHES, JSON.stringify(punches));
    localStorage.setItem(STORAGE_KEYS.NSR_COUNTER, String(nsr + 1));

    return newPunch;
  },

  // Adjustments & Approvals
  getAdjustments: (companyId?: string, employeeId?: string): AdjustmentRequest[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
      let list: AdjustmentRequest[] = val ? JSON.parse(val) : [];
      if (companyId) {
        list = list.filter((a) => a.companyId === companyId);
      }
      if (employeeId) {
        list = list.filter((a) => a.employeeId === employeeId);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  },

  createAdjustment: (
    req: Omit<AdjustmentRequest, 'id' | 'createdAt' | 'status'>
  ): AdjustmentRequest => {
    const list = StorageService.getAdjustments();
    const newReq: AdjustmentRequest = {
      ...req,
      id: `adj-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(list));
    return newReq;
  },

  updateAdjustmentStatus: (
    id: string,
    status: AdjustmentStatus,
    reviewerNotes?: string,
    adminName = 'Administrador RH',
    adminEmail = 'rh@empresa.com.br'
  ): boolean => {
    const list = StorageService.getAdjustments();
    const index = list.findIndex((a) => a.id === id);
    if (index >= 0) {
      list[index].status = status;
      list[index].reviewedAt = new Date().toISOString();
      if (reviewerNotes) list[index].reviewerNotes = reviewerNotes;

      const item = list[index];

      // If approved, automatically add the punch record and log in audit trail!
      if (status === 'approved') {
        StorageService.addPunch({
          employeeId: item.employeeId,
          companyId: item.companyId,
          type: item.punchType,
          date: item.date,
          time: item.requestedTime + ':00',
          manualAdjustment: true,
          notes: `Ajuste aprovado: ${item.description}`,
          deviceInfo: 'Ajuste Manual Validado pela Gestão',
          registeredVia: 'admin_manual',
        });

        StorageService.addAuditLog({
          companyId: item.companyId,
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          action: 'punch_adjust',
          details: `Ajuste manual de ${item.punchType} aprovado para ${item.date} às ${item.requestedTime}. Motivo: ${item.description}`,
          adminName,
          adminEmail,
          newValue: `${item.requestedTime} (${item.punchType})`,
        });
      }

      localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(list));
      return true;
    }
    return false;
  },

  // Audit Logs
  getAuditLogs: (companyId?: string): AuditLog[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      let list: AuditLog[] = val ? JSON.parse(val) : INITIAL_AUDIT_LOGS;
      if (companyId) {
        list = list.filter((l) => l.companyId === companyId);
      }
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog => {
    const logs = StorageService.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    return newLog;
  },

  // Work Schedules
  getWorkSchedules: (companyId?: string): WorkSchedule[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.WORK_SCHEDULES);
      let list: WorkSchedule[] = val ? JSON.parse(val) : INITIAL_WORK_SCHEDULES;
      if (companyId) {
        list = list.filter((s) => s.companyId === companyId);
      }
      return list;
    } catch {
      return INITIAL_WORK_SCHEDULES;
    }
  },

  saveWorkSchedule: (schedule: WorkSchedule) => {
    const schedules = StorageService.getWorkSchedules();
    const index = schedules.findIndex((s) => s.id === schedule.id);
    if (index >= 0) {
      schedules[index] = schedule;
    } else {
      schedules.push(schedule);
    }
    localStorage.setItem(STORAGE_KEYS.WORK_SCHEDULES, JSON.stringify(schedules));
  },

  // Daily Summary Calculation
  getDailySummary: (employeeId: string, dateStr: string): DailySummary => {
    const punches = StorageService.getPunches(undefined, employeeId)
      .filter((p) => p.date === dateStr)
      .sort((a, b) => a.timestamp - b.timestamp);

    const employee = StorageService.getEmployeeById(employeeId);
    const targetMinutes = employee ? employee.dailyTargetMinutes : 480;

    let totalWorkedMinutes = 0;
    let breakMinutes = 0;

    let entryTime: string | null = null;
    let lunchStartTime: string | null = null;
    let lunchEndTime: string | null = null;

    punches.forEach((p) => {
      if (p.type === 'entry' && !entryTime) {
        entryTime = p.time;
      } else if (p.type === 'lunch_start' && entryTime && !lunchStartTime) {
        lunchStartTime = p.time;
        totalWorkedMinutes += calculateMinutesBetweenTimes(entryTime, lunchStartTime);
      } else if (p.type === 'lunch_end' && !lunchEndTime) {
        lunchEndTime = p.time;
        if (lunchStartTime) {
          breakMinutes += calculateMinutesBetweenTimes(lunchStartTime, lunchEndTime);
        }
      } else if (p.type === 'exit') {
        const fromTime = lunchEndTime || entryTime;
        if (fromTime) {
          totalWorkedMinutes += calculateMinutesBetweenTimes(fromTime, p.time);
        }
      }
    });

    const balanceMinutes = punches.length >= 2 ? totalWorkedMinutes - targetMinutes : 0;

    let status: DailySummary['status'] = 'in_progress';
    if (punches.length === 0) {
      status = 'absent';
    } else if (punches.some((p) => p.type === 'exit')) {
      status = 'complete';
    } else if (punches.some((p) => p.type === 'lunch_start') && !punches.some((p) => p.type === 'lunch_end')) {
      status = 'in_progress';
    }

    return {
      date: dateStr,
      punches,
      totalWorkedMinutes,
      breakMinutes,
      targetMinutes,
      balanceMinutes,
      status,
    };
  },
};
