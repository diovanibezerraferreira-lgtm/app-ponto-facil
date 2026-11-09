import React from 'react';
import {
  X,
  Printer,
  CheckCircle,
  MapPin,
  Clock,
  ShieldCheck,
  Building,
  User,
  Hash,
  Download,
} from 'lucide-react';
import { PunchRecord, Employee, Company } from '../../types';
import {
  getPunchTypeLabel,
  formatDateBR,
  formatCPF,
  formatCNPJ,
} from '../../utils/formatters';

interface PunchReceiptModalProps {
  punch: PunchRecord | null;
  employee: Employee;
  company?: Company;
  onClose: () => void;
}

export const PunchReceiptModal: React.FC<PunchReceiptModalProps> = ({
  punch,
  employee,
  company,
  onClose,
}) => {
  if (!punch) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base leading-tight">Comprovante de Registro de Ponto</h3>
              <p className="text-[11px] text-emerald-100">
                Portaria 671/2021 MTE • Modelo Demonstrativo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content - Styled like a fiscal receipt / ticket */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 font-sans print:p-0">
          {/* Status badge */}
          <div className="text-center pb-3 border-b border-dashed border-slate-200">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Registro Efetuado com Sucesso</span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
              {punch.time}
            </p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {getPunchTypeLabel(punch.type)} • {formatDateBR(punch.date)}
            </p>
          </div>

          {/* Employer Info */}
          <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>Empregador:</span>
            </div>
            <p className="font-semibold text-slate-800">{company?.legalName || 'TechSoluções Ltda'}</p>
            <p className="text-slate-500 font-mono">CNPJ: {formatCNPJ(company?.cnpj || '12345678000190')}</p>
            <p className="text-slate-500">{company?.city} - {company?.state}</p>
          </div>

          {/* Employee Info */}
          <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Colaborador:</span>
            </div>
            <p className="font-semibold text-slate-800">{employee.name}</p>
            <div className="grid grid-cols-2 gap-2 text-slate-500">
              <p className="font-mono">CPF: {formatCPF(employee.cpf)}</p>
              <p className="font-mono">Matrícula: {employee.registrationNumber}</p>
            </div>
            <p className="text-slate-500">Cargo: {employee.role}</p>
          </div>

          {/* Technical and GPS Verification */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">Localização Geográfica:</p>
                <p className="text-[11px] text-slate-600">
                  {punch.location?.addressText || 'Localização Registrada via GPS'}
                </p>
                {punch.location && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Lat: {punch.location.latitude.toFixed(6)}, Lng: {punch.location.longitude.toFixed(6)} (±{punch.location.accuracy}m)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-50 border border-slate-200/60">
                <span className="text-slate-500 block font-medium">NSR (Nº Sequencial):</span>
                <span className="font-mono font-bold text-slate-800">#{punch.nsr}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200/60">
                <span className="text-slate-500 block font-medium">Dispositivo:</span>
                <span className="font-medium text-slate-800 truncate block">{punch.deviceInfo}</span>
              </div>
            </div>

            {/* Cryptographic Hash Representation */}
            <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1 font-sans font-semibold">
                  <Hash className="w-3 h-3 text-emerald-400" />
                  Assinatura Digital (Hash SHA-256):
                </span>
                <span className="text-emerald-400">Válido</span>
              </div>
              <p className="break-all tracking-wider text-emerald-300">
                {punch.receiptHash}
              </p>
            </div>
          </div>

          <div className="text-[10px] text-center text-slate-400 leading-tight">
            Este comprovante tem validade demonstrativa conforme especificações do programa de ponto eletrônico Ponto Fácil.
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={() => {
                // Download simulated receipt text
                const receiptContent = `==============================
PONTO FACIL - COMPROVANTE DE PONTO
==============================
NSR: #${punch.nsr}
Data: ${formatDateBR(punch.date)}
Horario: ${punch.time}
Tipo: ${getPunchTypeLabel(punch.type)}
Colaborador: ${employee.name}
CPF: ${formatCPF(employee.cpf)}
Empresa: ${company?.legalName || 'TechSolucoes Ltda'}
CNPJ: ${formatCNPJ(company?.cnpj || '12345678000190')}
Local: ${punch.location?.addressText || 'GPS Coordenadas'}
Assinatura: ${punch.receiptHash}
==============================`;
                const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `comprovante_ponto_${punch.date}_${punch.time.replace(/:/g, '')}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
