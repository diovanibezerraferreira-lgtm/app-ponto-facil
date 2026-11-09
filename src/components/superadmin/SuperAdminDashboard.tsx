import React, { useState } from 'react';
import {
  Building2,
  Users,
  Clock,
  DollarSign,
  Plus,
  Edit2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Database,
  Search,
  Sparkles,
} from 'lucide-react';
import { Company, Employee, PunchRecord } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCNPJ, formatDateBR } from '../../utils/formatters';
import { CompanyModal } from './CompanyModal';

interface SuperAdminDashboardProps {
  companies: Company[];
  allEmployees: Employee[];
  allPunches: PunchRecord[];
  onSelectCompanyToManage: (companyId: string) => void;
  onLaunchCompanyTerminal?: (companyId: string) => void;
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  companies,
  allEmployees,
  allPunches,
  onSelectCompanyToManage,
  onLaunchCompanyTerminal,
  onRefresh,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTotalPunches = allPunches.filter((p) => p.date === todayStr).length;

  const filteredCompanies = companies.filter((c) =>
    c.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj.includes(searchTerm) ||
    c.legalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simulated MRR calculation based on plans (Basic: R$ 89, Pro: R$ 189, Enterprise: R$ 389)
  const simulatedMrr = companies.reduce((acc, c) => {
    if (!c.active) return acc;
    if (c.plan === 'basic') return acc + 89;
    if (c.plan === 'pro') return acc + 189;
    if (c.plan === 'enterprise') return acc + 389;
    return acc + 120;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-purple-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Painel do Proprietário SaaS • Master Tenant Controller</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Gestão Multi-Empresas Ponto Fácil
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Controle global de empresas contratantes, planos, volumetria de marcações e isolamento de dados por CNPJ.
          </p>
        </div>

        <button
          onClick={() => {
            setCompanyToEdit(null);
            setCompanyModalOpen(true);
          }}
          className="px-5 py-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Empresa Cliente</span>
        </button>
      </div>

      {/* Global SaaS Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Empresas Clientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-slate-900 mt-2">
            {companies.filter((c) => c.active).length}
            <span className="text-xs text-slate-400 font-sans ml-1 font-normal">ativas</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {companies.length} cadastradas no total
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Colaboradores Gerenciados
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-indigo-600 mt-2">
            {allEmployees.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Vidas ativas na plataforma
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pontos Registrados Hoje
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-emerald-600 mt-2">
            {todayTotalPunches}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Marcações com geolocalização e hash
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              MRR SaaS (Estimado)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-slate-900 mt-2">
            R$ {simulatedMrr.toLocaleString('pt-BR')},00
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Receita recorrente mensal
          </p>
        </div>
      </div>

      {/* Companies List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Empresas Clientes Cadastradas ({companies.length})
            </h2>
            <p className="text-xs text-slate-500">
              Cada empresa tem isolamento total de colaboradores, marcações e banco de horas.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por empresa ou CNPJ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-6">Empresa Cliente</th>
                <th className="py-3 px-3">CNPJ</th>
                <th className="py-3 px-3">Plano</th>
                <th className="py-3 px-3 text-center">Colaboradores</th>
                <th className="py-3 px-3">Localização</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.map((comp) => {
                const compEmployees = allEmployees.filter((e) => e.companyId === comp.id);
                return (
                  <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 text-sm">{comp.tradeName}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{comp.legalName}</p>
                      <p className="text-[10px] text-slate-400">{comp.contactEmail}</p>
                    </td>

                    <td className="py-4 px-3 font-mono text-slate-700 font-medium">
                      {formatCNPJ(comp.cnpj)}
                    </td>

                    <td className="py-4 px-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {comp.plan}
                      </span>
                    </td>

                    <td className="py-4 px-3 text-center font-mono">
                      <span className="font-bold text-slate-900">{compEmployees.length}</span>
                      <span className="text-slate-400 text-[11px]"> / {comp.maxEmployees}</span>
                    </td>

                    <td className="py-4 px-3 text-slate-600">
                      {comp.city} - {comp.state}
                    </td>

                    <td className="py-4 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          comp.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {comp.active ? 'Ativa' : 'Bloqueada'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {onLaunchCompanyTerminal && (
                          <button
                            onClick={() => onLaunchCompanyTerminal(comp.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                            title="Abrir o Terminal Fixo desta empresa"
                          >
                            <span>Terminal</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setCompanyToEdit(comp);
                            setCompanyModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Editar Empresa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectCompanyToManage(comp.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1.5"
                          title="Acessar painel como Administrador desta Empresa"
                        >
                          <span>Acessar Painel</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supabase & Cloud Architecture Roadmap Card */}
      <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              Arquitetura Preparada para Integração Supabase
            </h3>
            <p className="text-xs text-slate-400">
              Pronto para migração de localStorage para PostgreSQL com Row Level Security (RLS)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="font-mono text-emerald-400 font-bold block mb-1">
              public.tenants (Empresas)
            </span>
            <p className="text-[11px] text-slate-400">
              Armazena CNPJ, razão social, plano e configurações com isolamento estrito via tenant_id.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="font-mono text-teal-400 font-bold block mb-1">
              public.punches (Marcações)
            </span>
            <p className="text-[11px] text-slate-400">
              Registros imutáveis com geolocalização PostGIS, NSR sequencial e assinatura SHA-256 (REP-P).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="font-mono text-indigo-400 font-bold block mb-1">
              public.time_bank (Banco de Horas)
            </span>
            <p className="text-[11px] text-slate-400">
              Cálculo contínuo de saldo de horas extras e compensações para fechamento de folha.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CompanyModal
        companyToEdit={companyToEdit}
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        onSave={(saved) => {
          StorageService.saveCompany(saved);
          onRefresh();
          onShowToast(
            'success',
            'Empresa Salva',
            `${saved.tradeName} foi ${companyToEdit ? 'atualizada' : 'cadastrada'} no SaaS com sucesso!`
          );
        }}
      />
    </div>
  );
};
