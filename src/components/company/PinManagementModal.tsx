import React, { useState } from 'react';
import { X, KeyRound, ShieldAlert, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Employee } from '../../types';

interface PinManagementModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePin: (employeeId: string, newPin: string) => void;
  onToggleBlock: (employeeId: string, block: boolean) => void;
}

export const PinManagementModal: React.FC<PinManagementModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSavePin,
  onToggleBlock,
}) => {
  const [newPin, setNewPin] = useState(employee?.pinCode || '');
  const [confirmPin, setConfirmPin] = useState(employee?.pinCode || '');
  const [error, setError] = useState('');

  if (!isOpen || !employee) return null;

  const handleGenerateRandomPin = () => {
    const random = String(Math.floor(1000 + Math.random() * 9000));
    setNewPin(random);
    setConfirmPin(random);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4 || newPin.length > 6) {
      setError('O código PIN deve possuir entre 4 e 6 dígitos numéricos.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('A confirmação do código não confere.');
      return;
    }
    onSavePin(employee.id, newPin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800 text-xs">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Código Individual de Acesso (PIN)</h3>
              <p className="text-[11px] text-slate-400">{employee.name} • {employee.registrationNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-700 block">Status do Código no Terminal:</span>
              <span className="text-[11px] text-slate-500">
                {employee.pinBlocked
                  ? 'Bloqueado por segurança ou ação administrativa'
                  : 'Ativo e liberado para bater ponto'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onToggleBlock(employee.id, !employee.pinBlocked)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 ${
                employee.pinBlocked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              {employee.pinBlocked ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Desbloquear Código</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Bloquear Código</span>
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Novo Código (4 a 6 dígitos)</label>
                <button
                  type="button"
                  onClick={handleGenerateRandomPin}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Gerar Aleatório</span>
                </button>
              </div>
              <input
                type="text"
                maxLength={6}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Ex: 2222"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-base font-bold text-slate-900 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirmar Código</label>
              <input
                type="text"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Repita o código"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-base font-bold text-slate-900 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {error && (
              <p className="text-rose-600 font-semibold text-xs text-center">{error}</p>
            )}

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <strong>Nota de Segurança & LGPD:</strong> Informe o código individual exclusivamente ao colaborador. Esta alteração será registrada na trilha de auditoria do sistema.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Novo Código</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
