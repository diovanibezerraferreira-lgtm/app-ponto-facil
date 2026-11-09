import { Company, Employee, PunchRecord, AdjustmentRequest, WorkSchedule, AuditLog } from '../types';
import { generateFakeHash } from '../utils/formatters';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    tradeName: 'TechSoluções Digital',
    legalName: 'TechSoluções Inovação e Tecnologia Ltda',
    cnpj: '12345678000190',
    plan: 'pro',
    maxEmployees: 25,
    active: true,
    createdAt: '2024-03-15',
    contactEmail: 'contato@techsolucoes.com.br',
    contactPhone: '(11) 3456-7890',
    city: 'São Paulo',
    state: 'SP',
    terminalName: 'Tablet Recepção - Sede Paulista',
    terminalDeviceCode: 'TER-TECH-01',
    terminalAddress: 'Av. Paulista, 1374 - Bela Vista, São Paulo - SP',
    kioskPassword: '1234',
  },
  {
    id: 'comp-2',
    tradeName: 'Café & Bistrô Bella Vista',
    legalName: 'Bella Vista Gastronomia e Cafés Ltda',
    cnpj: '98765432000111',
    plan: 'basic',
    maxEmployees: 10,
    active: true,
    createdAt: '2024-06-10',
    contactEmail: 'admin@bellavista.com.br',
    contactPhone: '(21) 2234-5678',
    city: 'Rio de Janeiro',
    state: 'RJ',
    terminalName: 'Celular Ponto Balcão',
    terminalDeviceCode: 'TER-BELLA-01',
    terminalAddress: 'Rua do Catete, 150 - Glória, Rio de Janeiro - RJ',
    kioskPassword: '1234',
  },
  {
    id: 'comp-3',
    tradeName: 'LogSul Distribuição',
    legalName: 'LogSul Transportes e Cargas Expressas SA',
    cnpj: '45678910000122',
    plan: 'enterprise',
    maxEmployees: 100,
    active: true,
    createdAt: '2023-11-01',
    contactEmail: 'rh@logsuldistribuicao.com.br',
    contactPhone: '(41) 3345-9900',
    city: 'Curitiba',
    state: 'PR',
    terminalName: 'Tablet Portaria Galpão 03',
    terminalDeviceCode: 'TER-LOGSUL-01',
    terminalAddress: 'Rod. BR-277, km 80 - Curitiba - PR',
    kioskPassword: '1234',
  },
];

export const INITIAL_WORK_SCHEDULES: WorkSchedule[] = [
  {
    id: 'sched-1',
    companyId: 'comp-1',
    name: 'Padrão Comercial (08:00 às 17:00 com 1h intervalo)',
    dailyTargetMinutes: 480, // 8h
    entryTime: '08:00',
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
    exitTime: '17:00',
    type: '5x2',
  },
  {
    id: 'sched-2',
    companyId: 'comp-1',
    name: 'Compensado CLT 44h (08:00 às 17:48)',
    dailyTargetMinutes: 528, // 8h48
    entryTime: '08:00',
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
    exitTime: '17:48',
    type: '5x2',
  },
  {
    id: 'sched-3',
    companyId: 'comp-1',
    name: 'Turno Comercial Tarde (09:00 às 18:00)',
    dailyTargetMinutes: 480,
    entryTime: '09:00',
    lunchStartTime: '13:00',
    lunchEndTime: '14:00',
    exitTime: '18:00',
    type: '5x2',
  },
  {
    id: 'sched-4',
    companyId: 'comp-2',
    name: 'Escala 6x1 Comércio (07:00 às 15:20)',
    dailyTargetMinutes: 440,
    entryTime: '07:00',
    lunchStartTime: '11:00',
    lunchEndTime: '12:00',
    exitTime: '15:20',
    type: '6x1',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  // Claudilene Souza - Example employee explicitly highlighted in prompt: code 2222
  {
    id: 'emp-claudilene',
    companyId: 'comp-1',
    name: 'Claudilene Souza',
    email: 'claudilene.souza@techsolucoes.com.br',
    cpf: '12345678909',
    registrationNumber: 'MAT-2222',
    role: 'Assistente Administrativo',
    department: 'Operações & RH',
    workScheduleName: 'Padrão Comercial (08:00 às 17:00 com 1h intervalo)',
    dailyTargetMinutes: 480,
    status: 'active',
    hireDate: '2023-01-10',
    timeBankMinutes: 135, // +2h15m positivo
    pinCode: '2222', // Código individual do terminal
    pinBlocked: false,
    failedPinAttempts: 0,
  },
  // Lucas Henrique Silva
  {
    id: 'emp-1',
    companyId: 'comp-1',
    name: 'Lucas Henrique Silva',
    email: 'lucas.silva@techsolucoes.com.br',
    cpf: '23456789012',
    registrationNumber: 'MAT-1042',
    role: 'Desenvolvedor Frontend Pleno',
    department: 'Tecnologia & Produto',
    workScheduleName: 'Padrão Comercial (08:00 às 17:00 com 1h intervalo)',
    dailyTargetMinutes: 480, // 8h
    status: 'active',
    hireDate: '2023-04-10',
    timeBankMinutes: 195, // +3h15m positivo
    pinCode: '1042',
    pinBlocked: false,
    failedPinAttempts: 0,
  },
  // Beatriz Alencar Santos
  {
    id: 'emp-2',
    companyId: 'comp-1',
    name: 'Beatriz Alencar Santos',
    email: 'beatriz.santos@techsolucoes.com.br',
    cpf: '34567890123',
    registrationNumber: 'MAT-1043',
    role: 'UI/UX Designer',
    department: 'Tecnologia & Produto',
    workScheduleName: 'Turno Comercial Tarde (09:00 às 18:00)',
    dailyTargetMinutes: 480,
    status: 'active',
    hireDate: '2023-08-01',
    timeBankMinutes: -45, // -45m devedor
    pinCode: '1043',
    pinBlocked: false,
    failedPinAttempts: 0,
  },
  // Mariana Castro
  {
    id: 'emp-3',
    companyId: 'comp-1',
    name: 'Mariana Castro',
    email: 'mariana.castro@techsolucoes.com.br',
    cpf: '45678901234',
    registrationNumber: 'MAT-1010',
    role: 'Gerente de Recursos Humanos',
    department: 'Recursos Humanos',
    workScheduleName: 'Padrão Comercial (08:00 às 17:00 com 1h intervalo)',
    dailyTargetMinutes: 480,
    status: 'active',
    hireDate: '2022-02-15',
    timeBankMinutes: 320, // +5h20m
    pinCode: '1010',
    pinBlocked: false,
    failedPinAttempts: 0,
  },
  // Carlos Eduardo Ramos
  {
    id: 'emp-4',
    companyId: 'comp-1',
    name: 'Carlos Eduardo Ramos',
    email: 'carlos.ramos@techsolucoes.com.br',
    cpf: '56789012345',
    registrationNumber: 'MAT-1055',
    role: 'Analista de Suporte e CS',
    department: 'Atendimento',
    workScheduleName: 'Padrão Comercial (08:00 às 17:00 com 1h intervalo)',
    dailyTargetMinutes: 480,
    status: 'active',
    hireDate: '2024-01-15',
    timeBankMinutes: 70,
    pinCode: '1055',
    pinBlocked: false,
    failedPinAttempts: 0,
  },
  // Juliana Mendes
  {
    id: 'emp-5',
    companyId: 'comp-1',
    name: 'Juliana Mendes',
    email: 'juliana.mendes@techsolucoes.com.br',
    cpf: '67890123456',
    registrationNumber: 'MAT-1060',
    role: 'Executiva de Contas',
    department: 'Comercial',
    workScheduleName: 'Padrão Comercial (08:00 às 17:00 com 1h intervalo)',
    dailyTargetMinutes: 480,
    status: 'active',
    hireDate: '2023-11-20',
    timeBankMinutes: 15,
    pinCode: '1060',
    pinBlocked: false,
    failedPinAttempts: 0,
  },
  // Rodrigo Nogueira
  {
    id: 'emp-6',
    companyId: 'comp-1',
    name: 'Rodrigo Nogueira',
    email: 'rodrigo.nogueira@techsolucoes.com.br',
    cpf: '78901234567',
    registrationNumber: 'MAT-1033',
    role: 'Analista Financeiro Sênior',
    department: 'Financeiro',
    workScheduleName: 'Padrão Comercial (08:00 às 17:00 com 1h intervalo)',
    dailyTargetMinutes: 480,
    status: 'vacation',
    hireDate: '2022-09-01',
    timeBankMinutes: 110,
    pinCode: '1033',
    pinBlocked: false,
    failedPinAttempts: 0,
  },

  // Bella Vista employees
  {
    id: 'emp-7',
    companyId: 'comp-2',
    name: 'Fernanda Oliveira',
    email: 'fernanda@bellavista.com.br',
    cpf: '89012345678',
    registrationNumber: 'MAT-001',
    role: 'Barista Chefe',
    department: 'Operações',
    workScheduleName: 'Escala 6x1 Comércio (07:00 às 15:20)',
    dailyTargetMinutes: 440,
    status: 'active',
    hireDate: '2024-06-15',
    timeBankMinutes: 60,
    pinCode: '7788',
    pinBlocked: false,
    failedPinAttempts: 0,
  },
  {
    id: 'emp-8',
    companyId: 'comp-2',
    name: 'Thiago Barreto',
    email: 'thiago@bellavista.com.br',
    cpf: '90123456789',
    registrationNumber: 'MAT-002',
    role: 'Atendente de Salão',
    department: 'Atendimento',
    workScheduleName: 'Escala 6x1 Comércio (07:00 às 15:20)',
    dailyTargetMinutes: 440,
    status: 'active',
    hireDate: '2024-07-01',
    timeBankMinutes: -30,
    pinCode: '9900',
    pinBlocked: false,
    failedPinAttempts: 0,
  },
];

// Helper to generate realistic historical punches for the past business days
export function generateInitialPunches(): PunchRecord[] {
  const records: PunchRecord[] = [];
  let nsrCounter = 10001;

  const today = new Date();
  const baseLat = -23.561684;
  const baseLng = -46.655981;
  const officeAddress = 'Av. Paulista, 1374 - Bela Vista, São Paulo - SP (Terminal Recepção)';

  for (let i = 10; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = d.toISOString().split('T')[0];

    // Seed punches for Claudilene (emp-claudilene)
    records.push(
      {
        id: `punch-${nsrCounter}`,
        employeeId: 'emp-claudilene',
        companyId: 'comp-1',
        date: dateStr,
        time: '07:56:40',
        timestamp: new Date(`${dateStr}T07:56:40`).getTime(),
        type: 'entry',
        location: {
          latitude: baseLat,
          longitude: baseLng,
          addressText: officeAddress,
          accuracy: 10,
        },
        deviceInfo: 'Terminal Tablet Empresa (Recepção)',
        nsr: nsrCounter++,
        receiptHash: generateFakeHash(),
        verifiedGps: true,
        registeredVia: 'kiosk_terminal',
      },
      {
        id: `punch-${nsrCounter}`,
        employeeId: 'emp-claudilene',
        companyId: 'comp-1',
        date: dateStr,
        time: '12:01:20',
        timestamp: new Date(`${dateStr}T12:01:20`).getTime(),
        type: 'lunch_start',
        location: {
          latitude: baseLat,
          longitude: baseLng,
          addressText: officeAddress,
          accuracy: 10,
        },
        deviceInfo: 'Terminal Tablet Empresa (Recepção)',
        nsr: nsrCounter++,
        receiptHash: generateFakeHash(),
        verifiedGps: true,
        registeredVia: 'kiosk_terminal',
      },
      {
        id: `punch-${nsrCounter}`,
        employeeId: 'emp-claudilene',
        companyId: 'comp-1',
        date: dateStr,
        time: '13:00:55',
        timestamp: new Date(`${dateStr}T13:00:55`).getTime(),
        type: 'lunch_end',
        location: {
          latitude: baseLat,
          longitude: baseLng,
          addressText: officeAddress,
          accuracy: 10,
        },
        deviceInfo: 'Terminal Tablet Empresa (Recepção)',
        nsr: nsrCounter++,
        receiptHash: generateFakeHash(),
        verifiedGps: true,
        registeredVia: 'kiosk_terminal',
      },
      {
        id: `punch-${nsrCounter}`,
        employeeId: 'emp-claudilene',
        companyId: 'comp-1',
        date: dateStr,
        time: '17:08:15',
        timestamp: new Date(`${dateStr}T17:08:15`).getTime(),
        type: 'exit',
        location: {
          latitude: baseLat,
          longitude: baseLng,
          addressText: officeAddress,
          accuracy: 10,
        },
        deviceInfo: 'Terminal Tablet Empresa (Recepção)',
        nsr: nsrCounter++,
        receiptHash: generateFakeHash(),
        verifiedGps: true,
        registeredVia: 'kiosk_terminal',
      }
    );

    // Seed punches for Lucas Silva (emp-1)
    const lucasVariations = [
      { entry: '07:58:12', lOut: '12:02:40', lIn: '13:01:15', exit: '17:05:30' },
      { entry: '08:04:10', lOut: '12:05:00', lIn: '13:08:22', exit: '17:15:45' },
      { entry: '07:55:00', lOut: '11:58:30', lIn: '13:00:10', exit: '17:30:00' },
      { entry: '08:01:25', lOut: '12:00:10', lIn: '13:02:00', exit: '17:02:18' },
    ];
    const sched = lucasVariations[i % lucasVariations.length];

    records.push(
      {
        id: `punch-${nsrCounter}`,
        employeeId: 'emp-1',
        companyId: 'comp-1',
        date: dateStr,
        time: sched.entry,
        timestamp: new Date(`${dateStr}T${sched.entry}`).getTime(),
        type: 'entry',
        location: {
          latitude: baseLat,
          longitude: baseLng,
          addressText: officeAddress,
          accuracy: 12,
        },
        deviceInfo: 'Terminal Tablet Empresa (Recepção)',
        nsr: nsrCounter++,
        receiptHash: generateFakeHash(),
        verifiedGps: true,
        registeredVia: 'kiosk_terminal',
      },
      {
        id: `punch-${nsrCounter}`,
        employeeId: 'emp-1',
        companyId: 'comp-1',
        date: dateStr,
        time: sched.lOut,
        timestamp: new Date(`${dateStr}T${sched.lOut}`).getTime(),
        type: 'lunch_start',
        location: {
          latitude: baseLat,
          longitude: baseLng,
          addressText: officeAddress,
          accuracy: 14,
        },
        deviceInfo: 'Terminal Tablet Empresa (Recepção)',
        nsr: nsrCounter++,
        receiptHash: generateFakeHash(),
        verifiedGps: true,
        registeredVia: 'kiosk_terminal',
      },
      {
        id: `punch-${nsrCounter}`,
        employeeId: 'emp-1',
        companyId: 'comp-1',
        date: dateStr,
        time: sched.lIn,
        timestamp: new Date(`${dateStr}T${sched.lIn}`).getTime(),
        type: 'lunch_end',
        location: {
          latitude: baseLat,
          longitude: baseLng,
          addressText: officeAddress,
          accuracy: 11,
        },
        deviceInfo: 'Terminal Tablet Empresa (Recepção)',
        nsr: nsrCounter++,
        receiptHash: generateFakeHash(),
        verifiedGps: true,
        registeredVia: 'kiosk_terminal',
      },
      {
        id: `punch-${nsrCounter}`,
        employeeId: 'emp-1',
        companyId: 'comp-1',
        date: dateStr,
        time: sched.exit,
        timestamp: new Date(`${dateStr}T${sched.exit}`).getTime(),
        type: 'exit',
        location: {
          latitude: baseLat,
          longitude: baseLng,
          addressText: officeAddress,
          accuracy: 10,
        },
        deviceInfo: 'Terminal Tablet Empresa (Recepção)',
        nsr: nsrCounter++,
        receiptHash: generateFakeHash(),
        verifiedGps: true,
        registeredVia: 'kiosk_terminal',
      }
    );
  }

  // Today's records for TechSoluções
  const todayStr = today.toISOString().split('T')[0];

  // Lucas Silva today: Entry at 08:02 and Lunch Out at 12:04
  records.push({
    id: `punch-${nsrCounter}`,
    employeeId: 'emp-1',
    companyId: 'comp-1',
    date: todayStr,
    time: '08:02:14',
    timestamp: new Date(`${todayStr}T08:02:14`).getTime(),
    type: 'entry',
    location: {
      latitude: baseLat,
      longitude: baseLng,
      addressText: officeAddress,
      accuracy: 10,
    },
    deviceInfo: 'Terminal Tablet Empresa (Recepção)',
    nsr: nsrCounter++,
    receiptHash: generateFakeHash(),
    verifiedGps: true,
    registeredVia: 'kiosk_terminal',
  });

  records.push({
    id: `punch-${nsrCounter}`,
    employeeId: 'emp-1',
    companyId: 'comp-1',
    date: todayStr,
    time: '12:03:50',
    timestamp: new Date(`${todayStr}T12:03:50`).getTime(),
    type: 'lunch_start',
    location: {
      latitude: baseLat,
      longitude: baseLng,
      addressText: officeAddress,
      accuracy: 12,
    },
    deviceInfo: 'Terminal Tablet Empresa (Recepção)',
    nsr: nsrCounter++,
    receiptHash: generateFakeHash(),
    verifiedGps: true,
    registeredVia: 'kiosk_terminal',
  });

  // Beatriz today: entry at 09:14
  records.push({
    id: `punch-${nsrCounter}`,
    employeeId: 'emp-2',
    companyId: 'comp-1',
    date: todayStr,
    time: '09:14:22',
    timestamp: new Date(`${todayStr}T09:14:22`).getTime(),
    type: 'entry',
    location: {
      latitude: baseLat,
      longitude: baseLng,
      addressText: officeAddress,
      accuracy: 16,
    },
    deviceInfo: 'Terminal Tablet Empresa (Recepção)',
    nsr: nsrCounter++,
    receiptHash: generateFakeHash(),
    verifiedGps: true,
    registeredVia: 'kiosk_terminal',
  });

  // Carlos Eduardo: entry at 07:58
  records.push({
    id: `punch-${nsrCounter}`,
    employeeId: 'emp-4',
    companyId: 'comp-1',
    date: todayStr,
    time: '07:58:33',
    timestamp: new Date(`${todayStr}T07:58:33`).getTime(),
    type: 'entry',
    location: {
      latitude: baseLat,
      longitude: baseLng,
      addressText: officeAddress,
      accuracy: 9,
    },
    deviceInfo: 'Terminal Tablet Empresa (Recepção)',
    nsr: nsrCounter++,
    receiptHash: generateFakeHash(),
    verifiedGps: true,
    registeredVia: 'kiosk_terminal',
  });

  return records;
}

export const INITIAL_ADJUSTMENTS: AdjustmentRequest[] = [
  {
    id: 'adj-101',
    companyId: 'comp-1',
    employeeId: 'emp-2',
    employeeName: 'Beatriz Alencar Santos',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    punchType: 'exit',
    requestedTime: '18:05',
    reasonType: 'esquecimento',
    description: 'Esqueci de bater a saída no terminal da empresa antes de sair para o cliente.',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'adj-102',
    companyId: 'comp-1',
    employeeId: 'emp-5',
    employeeName: 'Juliana Mendes',
    date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    punchType: 'lunch_end',
    requestedTime: '13:30',
    reasonType: 'atestado_medico',
    description: 'Consulta odontológica de emergência. Atestado de comparecimento anexado.',
    attachmentName: 'atestado_dentista_juliana.pdf',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    companyId: 'comp-1',
    employeeId: 'emp-claudilene',
    employeeName: 'Claudilene Souza',
    action: 'pin_change',
    details: 'Código individual de acesso PIN gerado e configurado como 2222',
    adminName: 'Mariana Castro',
    adminEmail: 'mariana.castro@techsolucoes.com.br',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    oldValue: '----',
    newValue: '••••',
  },
  {
    id: 'audit-002',
    companyId: 'comp-1',
    employeeId: 'emp-1',
    employeeName: 'Lucas Henrique Silva',
    action: 'punch_adjust',
    details: 'Ajuste manual de saída autorizado conforme Art. 74 CLT',
    adminName: 'Mariana Castro',
    adminEmail: 'mariana.castro@techsolucoes.com.br',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    oldValue: 'Sem marcação',
    newValue: '17:40:00 (Saída)',
  },
  {
    id: 'audit-003',
    companyId: 'comp-1',
    employeeId: 'emp-2',
    employeeName: 'Beatriz Alencar Santos',
    action: 'schedule_change',
    details: 'Alteração de jornada para Turno Tarde (09:00 às 18:00)',
    adminName: 'Mariana Castro',
    adminEmail: 'mariana.castro@techsolucoes.com.br',
    timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
    oldValue: '08:00 às 17:00',
    newValue: '09:00 às 18:00',
  },
];
