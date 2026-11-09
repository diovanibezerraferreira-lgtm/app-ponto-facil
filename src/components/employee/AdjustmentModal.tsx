import React, { useState } from 'react';
import {
  X,
  FileText,
  Clock,
  Calendar,
  Upload,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Employee, PunchType } from '../../types';
import { StorageService } from '../../services/storage';

interface AdjustmentModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [punchType, setPunchType] = useState<PunchType>('entry');
  const [requestedTime, setRequestedTime] = useState('08:00');
  const [reasonType, setReasonType] = useState<
    'esquecimento' | 'problema_tecnico' | 'atestado_medico' | 'servico_externo' | 'outro'
  >('esquecimento');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Por favor, informe uma justificativa detalhada.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      StorageService.createAdjustment({
        companyId: employee.companyId,
        employeeId: employee.id,
        employeeName: employee.name,
        date,
        punchType,
        requestedTime,
        reasonType,
        description,
        attachmentName: attachmentName || undefined,
      });

      setSubmitting(false);
      onSuccess('Solicitação de ajuste enviada ao RH com sucesso!');
      onClose();
    }, 400);
  };

  const handleSimulateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Solicitar Ajuste ou Atestado</h3>
              <p className="text-xs text-slate-400">
                Correção de marcação ou envio de comprovante ao RH
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data da Ocorrência
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário Pretendido
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Registro
              </label>
              <select
                value={punchType}
                onChange={(e) => setPunchType(e.target.value as PunchType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="entry">1ª Entrada</option>
                <option value="lunch_start">1ª Saída (Intervalo)</option>
                <option value="lunch_end">2ª Entrada (Retorno)</option>
                <option value="exit">2ª Saída (Fim)</option>
                <option value="extra">Marcação Extra</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo / Justificativa
              </label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="esquecimento">Esquecimento</option>
                <option value="problema_tecnico">Problema Técnico / Sem Bateria</option>
                <option value="atestado_medico">Atestado Médico / Dentista</option>
                <option value="servico_externo">Serviço Externo / Reunião</option>
                <option value="outro">Outro motivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Explicação Detalhada
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que ocorreu para que o gestor possa avaliar..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anexo Comprobatório (Opcional - Ex: Foto de Atestado / Declaração)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors relative bg-slate-50">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleSimulateFile}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              {attachmentName ? (
                <p className="text-xs font-semibold text-emerald-600 flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {attachmentName}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Clique ou arraste um arquivo (PDF, JPG, PNG até 5MB)
                </p>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              A solicitação passará por aprovação do gestor de RH antes de ser computada no espelho e no banco de horas.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
            >
              {submitting ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
