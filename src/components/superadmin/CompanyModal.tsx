import React, { useState } from 'react';
import { X, Building2, Save, Mail, Phone, MapPin, Shield } from 'lucide-react';
import { Company, PlanType } from '../../types';

interface CompanyModalProps {
  companyToEdit?: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Company) => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  companyToEdit,
  isOpen,
  onClose,
  onSave,
}) => {
  const [tradeName, setTradeName] = useState(companyToEdit?.tradeName || '');
  const [legalName, setLegalName] = useState(companyToEdit?.legalName || '');
  const [cnpj, setCnpj] = useState(companyToEdit?.cnpj || '');
  const [plan, setPlan] = useState<PlanType>(companyToEdit?.plan || 'pro');
  const [maxEmployees, setMaxEmployees] = useState(
    companyToEdit ? String(companyToEdit.maxEmployees) : '25'
  );
  const [contactEmail, setContactEmail] = useState(companyToEdit?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(companyToEdit?.contactPhone || '');
  const [city, setCity] = useState(companyToEdit?.city || 'São Paulo');
  const [state, setState] = useState(companyToEdit?.state || 'SP');
  const [active, setActive] = useState(companyToEdit ? companyToEdit.active : true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeName.trim() || !cnpj.trim() || !contactEmail.trim()) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const savedCompany: Company = {
      id: companyToEdit?.id || `comp-${Date.now()}`,
      tradeName,
      legalName: legalName || tradeName,
      cnpj: cnpj.replace(/\D/g, ''),
      plan,
      maxEmployees: parseInt(maxEmployees, 10) || 10,
      active,
      createdAt: companyToEdit?.createdAt || new Date().toISOString().split('T')[0],
      contactEmail,
      contactPhone,
      city,
      state,
      kioskPassword: companyToEdit?.kioskPassword || '1234',
    };

    onSave(savedCompany);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {companyToEdit ? 'Editar Empresa Cliente' : 'Nova Empresa Cliente (Tenant)'}
              </h3>
              <p className="text-xs text-slate-400">
                Gestão SaaS Multi-Empresas • Ponto Fácil
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Fantasia *
              </label>
              <input
                type="text"
                required
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Ex: Alfa Logística"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Razão Social
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ex: Alfa Logística e Transportes Ltda"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNPJ (Somente números) *
              </label>
              <input
                type="text"
                required
                maxLength={18}
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plano Contratado
              </label>
              <select
                value={plan}
                onChange={(e) => {
                  const p = e.target.value as PlanType;
                  setPlan(p);
                  if (p === 'basic') setMaxEmployees('10');
                  else if (p === 'pro') setMaxEmployees('25');
                  else if (p === 'enterprise') setMaxEmployees('100');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="basic">Básico (Até 10 funcionários)</option>
                <option value="pro">Profissional (Até 25 funcionários)</option>
                <option value="enterprise">Enterprise (Até 100+ funcionários)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Limite de Funcionários
              </label>
              <input
                type="number"
                min="1"
                max="500"
                required
                value={maxEmployees}
                onChange={(e) => setMaxEmployees(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status da Assinatura
              </label>
              <select
                value={active ? 'true' : 'false'}
                onChange={(e) => setActive(e.target.value === 'true')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="true">Ativa (Acesso Liberado)</option>
                <option value="false">Bloqueada / Suspensa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail de Contato *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contato@empresa.com.br"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                UF / Estado
              </label>
              <input
                type="text"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="SP"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{companyToEdit ? 'Salvar Alterações' : 'Cadastrar Empresa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
