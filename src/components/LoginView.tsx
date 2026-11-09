import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  Building2,
  UserCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { CurrentUserSession } from '../types';

interface LoginViewProps {
  onLogin: (session: CurrentUserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('lucas.silva@techsolucoes.com.br');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default smart routing based on entered email
    if (email.includes('admin') || email.includes('super')) {
      onLogin({
        role: 'saas_superadmin',
        name: 'Administrador SaaS Master',
        email: email || 'master@pontofacil.com.br',
      });
    } else if (email.includes('mariana') || email.includes('gestor') || email.includes('rh')) {
      onLogin({
        role: 'company_admin',
        name: 'Mariana Castro',
        email: email || 'mariana.castro@techsolucoes.com.br',
        companyId: 'comp-1',
      });
    } else {
      onLogin({
        role: 'employee',
        name: 'Lucas Henrique Silva',
        email: email || 'lucas.silva@techsolucoes.com.br',
        companyId: 'comp-1',
        employeeId: 'emp-1',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Background glow decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left column: Branding & Value prop */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema Homologado em Demonstração • Portaria 671 MTE</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Clock className="w-7 h-7 stroke-[2.3]" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Ponto<span className="text-emerald-400">Fácil</span>
              </h1>
            </div>
            <p className="text-lg text-slate-300 max-w-lg mx-auto lg:mx-0">
              Controle de ponto eletrônico corporativo dividido em dois aplicativos integrados: <strong>Terminal Fixo no Tablet da Empresa</strong> e <strong>Painel do Administrador</strong>.
            </p>
          </div>

          {/* Key Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <MapPin className="w-4 h-4" />
                <span>Terminal Fixo (Tablet)</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Funcionários batem ponto no tablet da empresa com código individual (ex: Claudilene 2222).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
                <Clock className="w-4 h-4" />
                <span>Trilha de Auditoria</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ajustes e alterações de código realizados exclusivamente pelo administrador com justificativa legal.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                <Building2 className="w-4 h-4" />
                <span>Multi-Empresas SaaS</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Cada terminal é vinculado à empresa e acessa exclusivamente a base de dados daquele CNPJ.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Jornadas & Banco de Horas</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Escalas 5x2, 6x1, 12x36, relatórios mensais e comprovantes fiscais conforme Portaria 671 MTE.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Login card + Fast demo access */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Acesse sua conta</h2>
              <p className="text-xs text-slate-400 mt-1">
                Informe suas credenciais ou use um dos perfis pré-configurados de demonstração abaixo.
              </p>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="mb-6 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Acesso Imediato para Demonstração:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onLogin({
                      role: 'employee',
                      name: 'Lucas Henrique Silva',
                      email: 'lucas.silva@techsolucoes.com.br',
                      companyId: 'comp-1',
                      employeeId: 'emp-1',
                    })
                  }
                  className="px-2.5 py-2 text-xs font-medium text-emerald-200 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/40 rounded-lg transition-all text-left flex flex-col justify-between group"
                >
                  <span className="font-bold flex items-center justify-between text-white">
                    Colaborador
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-emerald-400" />
                  </span>
                  <span className="text-[10px] text-emerald-300/80 mt-1">Bater ponto e espelho</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onLogin({
                      role: 'company_admin',
                      name: 'Mariana Castro',
                      email: 'mariana.castro@techsolucoes.com.br',
                      companyId: 'comp-1',
                    })
                  }
                  className="px-2.5 py-2 text-xs font-medium text-indigo-200 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-700/40 rounded-lg transition-all text-left flex flex-col justify-between group"
                >
                  <span className="font-bold flex items-center justify-between text-white">
                    Gestor da Empresa
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-indigo-400" />
                  </span>
                  <span className="text-[10px] text-indigo-300/80 mt-1">Painel RH TechSoluções</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onLogin({
                      role: 'saas_superadmin',
                      name: 'Administrador SaaS Master',
                      email: 'master@pontofacil.com.br',
                    })
                  }
                  className="px-2.5 py-2 text-xs font-medium text-purple-200 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/40 rounded-lg transition-all text-left flex flex-col justify-between group"
                >
                  <span className="font-bold flex items-center justify-between text-white">
                    Super Admin
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-purple-400" />
                  </span>
                  <span className="text-[10px] text-purple-300/80 mt-1">Painel Master SaaS</span>
                </button>
              </div>
            </div>

            {/* Traditional Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-mail corporativo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.nome@empresa.com.br"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Senha de acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
                  />
                  <span>Lembrar meu acesso neste dispositivo</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <UserCheck className="w-4 h-4" />
                <span>Entrar no Ponto Fácil</span>
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">
                Ambiente de demonstração funcional • Compatível com computadores e celulares
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-200">
            <h3 className="text-lg font-bold text-white mb-2">Recuperar Senha</h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe seu e-mail cadastrado para receber instruções de redefinição de senha.
            </p>

            {forgotSent ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-white">E-mail de recuperação enviado!</p>
                <p className="text-xs text-emerald-300">
                  Verifique a caixa de entrada de {forgotEmail || 'seu e-mail'}.
                </p>
                <button
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotSent(false);
                  }}
                  className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSent(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Seu e-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="exemplo@empresa.com.br"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                  >
                    Enviar Instruções
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
