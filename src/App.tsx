/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CurrentUserSession, Company, Employee, PunchRecord, AppMode } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { KioskTerminalView } from './components/terminal/KioskTerminalView';
import { CompanyDashboard } from './components/company/CompanyDashboard';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { NotificationToast, ToastMessage } from './components/common/NotificationToast';
import { Tablet, LayoutDashboard, ShieldCheck } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<CurrentUserSession | null>(() => {
    return StorageService.getSession();
  });

  const [appMode, setAppMode] = useState<AppMode>('admin_panel');

  const [companies, setCompanies] = useState<Company[]>(() => {
    return StorageService.getCompanies();
  });

  const [allEmployees, setAllEmployees] = useState<Employee[]>(() => {
    return StorageService.getEmployees();
  });

  const [allPunches, setAllPunches] = useState<PunchRecord[]>(() => {
    return StorageService.getPunches();
  });

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Reload data from storage
  const refreshAllData = () => {
    setCompanies(StorageService.getCompanies());
    setAllEmployees(StorageService.getEmployees());
    setAllPunches(StorageService.getPunches());
  };

  const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    setToast({
      id: String(Date.now()),
      type,
      title,
      message,
    });
  };

  const handleLogin = (newSession: CurrentUserSession) => {
    StorageService.setSession(newSession);
    setSession(newSession);
    refreshAllData();
    showToast('success', `Bem-vindo(a), ${newSession.name}!`, 'Acesso autenticado ao Painel.');
  };

  const handleLogout = () => {
    setSession(null);
    showToast('info', 'Sessão Encerrada', 'Você saiu do Ponto Fácil.');
  };

  const handleSelectCompany = (companyId: string) => {
    if (!session) return;
    const updatedSession: CurrentUserSession = {
      ...session,
      companyId,
    };
    StorageService.setSession(updatedSession);
    setSession(updatedSession);
    StorageService.setKioskCompanyId(companyId);
    const company = companies.find((c) => c.id === companyId);
    showToast('info', 'Empresa Selecionada', `Alternado para ${company?.tradeName || 'empresa'}.`);
  };

  const handleSwitchRole = (
    role: CurrentUserSession['role'],
    employeeId?: string,
    companyId?: string
  ) => {
    const targetCompId = companyId || session?.companyId || 'comp-1';

    let newSession: CurrentUserSession;
    if (role === 'employee') {
      const targetEmpId = employeeId || 'emp-claudilene';
      const emp = StorageService.getEmployeeById(targetEmpId);
      newSession = {
        role: 'employee',
        name: emp?.name || 'Claudilene Souza',
        email: emp?.email || 'claudilene.souza@techsolucoes.com.br',
        companyId: emp?.companyId || targetCompId,
        employeeId: emp?.id || targetEmpId,
      };
    } else if (role === 'company_admin') {
      newSession = {
        role: 'company_admin',
        name: 'Mariana Castro (Gestora RH)',
        email: 'mariana.castro@techsolucoes.com.br',
        companyId: targetCompId,
      };
    } else {
      newSession = {
        role: 'saas_superadmin',
        name: 'Administrador SaaS Master',
        email: 'master@pontofacil.com.br',
      };
    }

    StorageService.setSession(newSession);
    setSession(newSession);
    refreshAllData();
    showToast(
      'info',
      'Perfil Alternado',
      `Visualizando como ${newSession.name}.`
    );
  };

  const handleResetData = () => {
    StorageService.resetAll();
    refreshAllData();
    const defaultSess = StorageService.getSession();
    setSession(defaultSess);
    showToast('success', 'Dados Restaurados', 'Todos os dados de demonstração foram restaurados.');
  };

  // Determine current active company
  const currentCompany = companies.find((c) => c.id === (session?.companyId || 'comp-1')) || companies[0];

  const [kioskExitTrigger, setKioskExitTrigger] = useState(0);

  // APLICATIVO 1: TERMINAL DE PONTO DA EMPRESA (TABLET / CELULAR FIXO)
  if (appMode === 'kiosk_terminal') {
    return (
      <div className="relative min-h-screen">
        <KioskTerminalView
          company={currentCompany}
          onExitToAdmin={() => {
            setAppMode('admin_panel');
            showToast('info', 'Modo Quiosque Finalizado', 'Retornado ao Painel do Administrador.');
          }}
          onShowToast={showToast}
          requestExitTrigger={kioskExitTrigger}
        />

        {/* Floating Quick Dock for evaluation & testing - Requires Administrator Password */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setKioskExitTrigger((prev) => prev + 1)}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-2xl text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 group"
            title="Sair do Modo Quiosque (Requer Senha do Administrador)"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Sair do Quiosque (Requer Senha)</span>
          </button>
        </div>

        <NotificationToast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // If not logged in and not in kiosk, show Login view
  if (!session) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <NotificationToast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  // APLICATIVO 2: PAINEL DO ADMINISTRADOR (WEB RESPONSIVO)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navbar with App Switcher, Tenant Switcher & Demo controls */}
      <Navbar
        session={session}
        appMode={appMode}
        companies={companies}
        currentCompany={currentCompany}
        onSelectCompany={handleSelectCompany}
        onSwitchAppMode={setAppMode}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        onResetData={handleResetData}
      />

      {/* Main Admin View Content */}
      <main className="flex-1 pb-12">
        {session.role === 'saas_superadmin' ? (
          <SuperAdminDashboard
            companies={companies}
            allEmployees={allEmployees}
            allPunches={allPunches}
            onSelectCompanyToManage={(companyId) => {
              handleSwitchRole('company_admin', undefined, companyId);
            }}
            onLaunchCompanyTerminal={(companyId) => {
              handleSelectCompany(companyId);
              setAppMode('kiosk_terminal');
            }}
            onRefresh={refreshAllData}
            onShowToast={showToast}
          />
        ) : (
          <CompanyDashboard
            company={currentCompany}
            onOpenTerminal={() => {
              setAppMode('kiosk_terminal');
              showToast('info', 'Terminal de Ponto Iniciado', `Aparelho vinculado a ${currentCompany.tradeName}.`);
            }}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Discrete Legal & Compliance Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700">
            Ponto Fácil • Sistema de Ponto Eletrônico Corporativo (Dois Aplicativos: Terminal Fixo + Painel Admin)
          </p>
          <p className="text-[11px] text-slate-400 max-w-2xl mx-auto">
            Terminal exclusivo da empresa para registro via código individual (ex: Claudilene digita 2222) sem celular pessoal dos colaboradores. Painel web do gestor com jornadas, banco de horas e trilha de auditoria. Portaria 671/2021 MTE (REP-P).
          </p>
        </div>
      </footer>

      {/* Floating Notification Toast */}
      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
