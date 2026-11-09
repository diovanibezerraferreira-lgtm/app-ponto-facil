export type UserRole = 'employee' | 'company_admin' | 'saas_superadmin';

export type AppMode = 'kiosk_terminal' | 'admin_panel';

export type PlanType = 'basic' | 'pro' | 'enterprise';

export interface WorkSchedule {
  id: string;
  companyId: string;
  name: string;
  dailyTargetMinutes: number;
  entryTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  exitTime: string;
  type: '5x2' | '6x1' | '12x36' | 'flexible';
}

export interface Company {
  id: string;
  tradeName: string; // Nome Fantasia
  legalName: string; // Razão Social
  cnpj: string;
  plan: PlanType;
  maxEmployees: number;
  active: boolean;
  createdAt: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;
  terminalName?: string; // Ex: 'Tablet Recepção - Unidade Principal'
  terminalDeviceCode?: string; // Código de pareamento do terminal
  terminalAddress?: string;
  kioskPassword: string; // Senha configurável para sair do modo quiosque (ex: '1234')
}

export type EmployeeStatus = 'active' | 'vacation' | 'leave' | 'terminated';

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  email: string;
  cpf: string;
  registrationNumber: string; // Matrícula
  role: string; // Cargo
  department: string;
  avatarUrl?: string;
  workScheduleName: string; // Ex: 'Seg a Sex - 44h semanais (08h às 17h48)'
  dailyTargetMinutes: number; // ex: 528 min = 8h48m ou 480 min = 8h
  status: EmployeeStatus;
  hireDate: string;
  terminationDate?: string;
  terminationReason?: string;
  timeBankMinutes: number; // Saldo de banco de horas em minutos (+ ou -)
  pinCode: string; // Código individual de acesso (ex: 2222 para Claudilene)
  pinBlocked: boolean; // Se o código foi bloqueado pelo admin ou por tentativas incorretas
  failedPinAttempts: number; // Contador de tentativas incorretas
}

export type PunchType = 'entry' | 'lunch_start' | 'lunch_end' | 'exit' | 'extra';

export interface PunchLocation {
  latitude: number;
  longitude: number;
  addressText: string;
  accuracy: number;
}

export interface PunchRecord {
  id: string;
  employeeId: string;
  companyId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  timestamp: number;
  type: PunchType;
  location?: PunchLocation;
  deviceInfo: string;
  nsr: number; // Número Sequencial de Registro (Portaria 671)
  receiptHash: string; // Assinatura hash simulada
  verifiedGps: boolean;
  manualAdjustment?: boolean;
  notes?: string;
  registeredVia: 'kiosk_terminal' | 'admin_manual';
  syncStatus?: 'synced' | 'pending_sync'; // Offline sync state
  syncedAt?: string; // Timestamp when connection synced
  connectionStateAtPunch?: 'offline' | 'online'; // Network state at the exact moment punch was made
  terminalId?: string; // Terminal identifier (e.g. TER-01)
  terminalName?: string; // Terminal label (e.g. Tablet Recepção)
  syncBatchId?: string; // Identifier of synchronization batch
  storageDriver?: 'indexedDB' | 'localStorage'; // Local persistence mechanism
}

export interface SyncHistoryEntry {
  id: string;
  companyId: string;
  terminalId: string;
  terminalName: string;
  timestamp: string;
  syncedCount: number;
  punchIds: string[];
  status: 'success' | 'partial' | 'failed';
  errorMessage?: string;
  durationMs: number;
}

export interface TerminalStatus {
  companyId: string;
  terminalId: string;
  terminalName: string;
  isOnline: boolean;
  lastHeartbeat: string;
  lastSyncAt?: string;
  pendingPunchesCount: number;
  totalSyncedCount: number;
}

export interface DailySummary {
  date: string;
  punches: PunchRecord[];
  totalWorkedMinutes: number;
  breakMinutes: number;
  targetMinutes: number;
  balanceMinutes: number; // saldo do dia
  status: 'complete' | 'in_progress' | 'irregular' | 'absent' | 'day_off' | 'holiday';
}

export type AdjustmentStatus = 'pending' | 'approved' | 'rejected';

export interface AdjustmentRequest {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchType: PunchType;
  requestedTime: string;
  reasonType: 'esquecimento' | 'problema_tecnico' | 'atestado_medico' | 'servico_externo' | 'outro';
  description: string;
  attachmentName?: string;
  status: AdjustmentStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

export interface AuditLog {
  id: string;
  companyId: string;
  employeeId?: string;
  employeeName?: string;
  action:
    | 'punch_manual_create'
    | 'punch_adjust'
    | 'pin_change'
    | 'pin_block'
    | 'pin_unblock'
    | 'schedule_change'
    | 'employee_create'
    | 'employee_edit'
    | 'employee_delete'
    | 'employee_terminate'
    | 'employee_reactivate'
    | 'kiosk_password_change'
    | 'kiosk_sync';
  details: string;
  adminName: string;
  adminEmail: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
}

export interface CurrentUserSession {
  role: UserRole;
  email: string;
  name: string;
  companyId?: string;
  employeeId?: string;
}

