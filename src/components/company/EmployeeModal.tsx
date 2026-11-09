import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Save,
  KeyRound,
  Sparkles,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Employee, Company } from '../../types';

interface EmployeeModalProps {
  company: Company;
  employeeToEdit?: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  company,
  employeeToEdit,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(employeeToEdit?.name || '');
  const [email, setEmail] = useState(employeeToEdit?.email || '');
  const [cpf, setCpf] = useState(employeeToEdit?.cpf || '');
  const [registrationNumber, setRegistrationNumber] = useState(
    employeeToEdit?.registrationNumber || `MAT-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [role, setRole] = useState(employeeToEdit?.role || '');
  const [department, setDepartment] = useState(employeeToEdit?.department || 'Geral');
  const [workScheduleName, setWorkScheduleName] = useState(
    employeeToEdit?.workScheduleName || 'Padrão Comercial (08:00 às 17:00 com 1h intervalo)'
  );
  const [dailyTargetHours, setDailyTargetHours] = useState(
    employeeToEdit ? String(employeeToEdit.dailyTargetMinutes / 60) : '8'
  );
  const [pinCode, setPinCode] = useState(
    employeeToEdit?.pinCode || String(Math.floor(1000 + Math.random() * 9000))
  );
  const [status, setStatus] = useState<Employee['status']>(employeeToEdit?.status || 'active');
  const [initialTimeBankHours, setInitialTimeBankHours] = useState(
    employeeToEdit ? String(Math.round(employeeToEdit.timeBankMinutes / 60)) : '0'
  );

  if (!isOpen) return null;

  const handleGeneratePin = () => {
    setPinCode(String(Math.floor(1000 + Math.random() * 9000)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // REGRA DE CADASTRO SIMPLIFICADO: APENAS NOME E CÓDIGO PIN SÃO OBRIGATÓRIOS!
    if (!name.trim()) {
      alert('Por favor, preencha o Nome do colaborador.');
      return;
    }

    if (!pinCode.trim() || pinCode.trim().length < 4) {
      alert('Por favor, informe um Código PIN de no mínimo 4 dígitos para acesso ao terminal.');
      return;
    }

    const cleanName = name.trim();

    // Valores padrão automáticos para qualquer campo opcional deixado em branco
    const cleanCompanyDomain = (company.tradeName || 'empresa')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    const generatedEmail =
      cleanName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '.')
        .replace(/\.+/g, '.') +
      `@${cleanCompanyDomain || 'empresa'}.com.br`;

    const sanitizedEmail = email.trim() || generatedEmail;
    const sanitizedCpf = cpf.trim() ? cpf.replace(/\D/g, '') : '00000000000';
    const sanitizedRole = role.trim() || 'Colaborador(a)';
    const sanitizedReg =
      registrationNumber.trim() || `MAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const sanitizedDept = department.trim() || 'Geral';
    const sanitizedSchedule =
      workScheduleName.trim() || 'Padrão Comercial (08:00 às 17:00 com 1h intervalo)';

    const dailyTargetMinutes = Math.round(parseFloat(dailyTargetHours || '8') * 60);
    const timeBankMinutes = Math.round(parseFloat(initialTimeBankHours || '0') * 60);

    const savedEmployee: Employee = {
      id: employeeToEdit?.id || `emp-${Date.now()}`,
      companyId: company.id,
      name: cleanName,
      email: sanitizedEmail,
      cpf: sanitizedCpf,
      registrationNumber: sanitizedReg,
      role: sanitizedRole,
      department: sanitizedDept,
      workScheduleName: sanitizedSchedule,
      dailyTargetMinutes,
      status,
      hireDate: employeeToEdit?.hireDate || new Date().toISOString().split('T')[0],
      terminationDate: employeeToEdit?.terminationDate,
      terminationReason: employeeToEdit?.terminationReason,
      timeBankMinutes: employeeToEdit ? employeeToEdit.timeBankMinutes : timeBankMinutes,
      pinCode: pinCode.trim(),
      pinBlocked: employeeToEdit ? employeeToEdit.pinBlocked : false,
      failedPinAttempts: employeeToEdit ? employeeToEdit.failedPinAttempts : 0,
    };

    onSave(savedEmployee);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {employeeToEdit ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}
              </h3>
              <p className="text-xs text-slate-400">
                Empresa: {company.tradeName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-slate-800 text-sm">
          {/* Informative Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-xs text-emerald-950 flex items-start gap-2.5 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Cadastro Rápido e Descomplicado</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Apenas o <strong>Nome Completo</strong> e o <strong>Código do Terminal (PIN)</strong> são obrigatórios para que o colaborador possa começar a bater ponto imediatamente no celular/tablet da empresa. Todos os outros dados são opcionais!
              </p>
            </div>
          </div>

          {/* Section 1: Required Fields (Nome e PIN) */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Campos Obrigatórios</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nome Completo <span className="text-emerald-600 font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Claudilene Souza"
                  className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
              </div>

              {/* PIN Code for Terminal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    Código Terminal (PIN) <span className="text-emerald-600 font-extrabold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePin}
                    className="text-[11px] text-emerald-700 font-bold hover:underline"
                    title="Gerar código PIN aleatório de 4 dígitos"
                  >
                    Gerar Aleatório
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 2222"
                    className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-mono font-black text-emerald-800 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                  <KeyRound className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Código que o colaborador digita no tablet (ex: <strong>2222</strong>).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Optional Fields */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Dados Adicionais Complementares (Opcionais)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cargo / Função <span className="text-slate-400 text-[10px]">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex: Assistente, Vendedor, Operador..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Departamento / Setor <span className="text-slate-400 text-[10px]">(Opcional)</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Geral">Geral</option>
                  <option value="Tecnologia & Produto">Tecnologia & Produto</option>
                  <option value="Atendimento & Suporte">Atendimento & Suporte</option>
                  <option value="Comercial & Vendas">Comercial & Vendas</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Financeiro & Contábil">Financeiro & Contábil</option>
                  <option value="Operações & Logística">Operações & Logística</option>
                  <option value="Produção">Produção</option>
                  <option value="Diretoria">Diretoria</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  E-mail <span className="text-slate-400 text-[10px]">(Opcional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@empresa.com.br"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CPF <span className="text-slate-400 text-[10px]">(Opcional)</span>
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Matrícula <span className="text-slate-400 text-[10px]">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="MAT-0001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Escala de Trabalho <span className="text-slate-400 text-[10px]">(Opcional)</span>
                </label>
                <select
                  value={workScheduleName}
                  onChange={(e) => setWorkScheduleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Padrão Comercial (08:00 às 17:00 com 1h intervalo)">
                    Padrão Comercial (08h às 17h • 1h intervalo)
                  </option>
                  <option value="Compensado CLT 44h (08:00 às 17:48)">
                    Compensado CLT 44h (08h às 17h48)
                  </option>
                  <option value="Turno Comercial Tarde (09:00 às 18:00)">
                    Turno Tarde (09h às 18h)
                  </option>
                  <option value="Escala 6x1 Comércio (07:00 às 15:20)">
                    Escala 6x1 (07h às 15h20)
                  </option>
                  <option value="Escala 12x36 (07:00 às 19:00)">
                    Escala 12x36 (07h às 19h00)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Carga Diária (Horas) <span className="text-slate-400 text-[10px]">(Opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max="12"
                  value={dailyTargetHours}
                  onChange={(e) => setDailyTargetHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Status <span className="text-slate-400 text-[10px]">(Opcional)</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Ativo (Em atividade normal)</option>
                  <option value="vacation">Férias</option>
                  <option value="leave">Afastamento / Licença</option>
                  <option value="terminated">Demitido / Desligado</option>
                </select>
              </div>

              {!employeeToEdit && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Saldo Inicial Banco de Horas <span className="text-slate-400 text-[10px]">(Opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={initialTimeBankHours}
                    onChange={(e) => setInitialTimeBankHours(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{employeeToEdit ? 'Salvar Alterações' : 'Salvar Colaborador'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
