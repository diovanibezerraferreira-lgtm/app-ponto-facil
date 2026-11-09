import React from 'react';
import {
  Clock,
  Building2,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Tablet,
  LayoutDashboard,
} from 'lucide-react';
import { CurrentUserSession, Company, AppMode } from '../types';

interface NavbarProps {
  session: CurrentUserSession;
  appMode: AppMode;
  companies: Company[];
  currentCompany?: Company;
  onSelectCompany: (companyId: string) => void;
  onSwitchAppMode: (mode: AppMode) => void;
  onSwitchRole: (role: CurrentUserSession['role'], employeeId?: string, companyId?: string) => void;
  onLogout: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  appMode,
  companies,
  currentCompany,
  onSelectCompany,
  onSwitchAppMode,
  onSwitchRole,
  onLogout,
  onResetData,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = React.useState(false);

  const roleLabels: Record<CurrentUserSession['role'], { label: string; bg: string; text: string }> = {
    employee: {
      label: 'Colaborador',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      text: 'Área do Funcionário',
    },
    company_admin: {
      label: 'Gestor da Empresa',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      text: 'Painel RH & Gestão',
    },
    saas_superadmin: {
      label: 'Super Admin SaaS',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      text: 'Proprietário da Plataforma',
    },
  };

  const currentRoleInfo = roleLabels[session.role];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Clock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Ponto<span className="text-emerald-600">Fácil</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200">
                  SaaS PME
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Controle de Ponto Eletrônico Inteligente
              </p>
            </div>
          </div>

          {/* TWO APPS SWITCHER (Center): Kiosk Terminal vs Admin Panel */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => onSwitchAppMode('admin_panel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                appMode === 'admin_panel'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Acessar o Painel de Gestão e RH"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
              <span>Painel Admin</span>
            </button>

            <button
              onClick={() => onSwitchAppMode('kiosk_terminal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                appMode === 'kiosk_terminal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Abrir o Terminal Fixo de Tablet da Empresa"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Terminal de Ponto</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>
          </div>

          {/* Right: Tenant Selector + Demo Switcher + Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tenant / Company Selector */}
            {session.role !== 'saas_superadmin' && currentCompany ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="max-w-[150px] truncate">{currentCompany.tradeName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {companyDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Empresa Ativa (Multi-Tenant)
                    </div>
                    {companies.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectCompany(c.id);
                          setCompanyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          c.id === currentCompany.id ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate font-medium">{c.tradeName}</p>
                          <p className="text-[10px] text-slate-400">{c.city} - {c.state}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {c.plan}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border shadow-xs transition-all bg-white hover:bg-slate-50 text-slate-800 border-slate-300"
                title="Trocar perfil de demonstração"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Perfil:</span>
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border ${currentRoleInfo.bg}`}>
                  {currentRoleInfo.label}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800">Troca Rápida de Perfil</p>
                    <p className="text-[11px] text-slate-500">
                      Alterne instantaneamente para testar cada visão do sistema.
                    </p>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        onSwitchRole('company_admin', undefined, 'comp-1');
                        onSwitchAppMode('admin_panel');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                        session.role === 'company_admin' ? 'bg-indigo-50/70 border border-indigo-200' : ''
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        MC
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Mariana Castro (Gestora RH)</p>
                        <p className="text-[11px] text-slate-500">TechSoluções • Painel do Administrador</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onSwitchRole('saas_superadmin');
                        onSwitchAppMode('admin_panel');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                        session.role === 'saas_superadmin' ? 'bg-purple-50/70 border border-purple-200' : ''
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        SA
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Proprietário SaaS (Master)</p>
                        <p className="text-[11px] text-slate-500">Gestão global de todas as empresas clientes</p>
                      </div>
                    </button>
                  </div>

                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        if (window.confirm('Deseja restaurar todos os dados de demonstração para o padrão original?')) {
                          onResetData();
                          setProfileDropdownOpen(false);
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Restaurar dados de teste</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sair do sistema"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
