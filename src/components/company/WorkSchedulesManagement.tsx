import React, { useState } from 'react';
import { Calendar, Plus, Clock, Users, Edit2, Save, X, CheckCircle2 } from 'lucide-react';
import { WorkSchedule, Company, Employee } from '../../types';
import { StorageService } from '../../services/storage';
import { formatMinutesToHours } from '../../utils/formatters';

interface WorkSchedulesManagementProps {
  company: Company;
  employees: Employee[];
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const WorkSchedulesManagement: React.FC<WorkSchedulesManagementProps> = ({
  company,
  employees,
  onRefresh,
  onShowToast,
}) => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>(() =>
    StorageService.getWorkSchedules(company.id)
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<WorkSchedule['type']>('5x2');
  const [entryTime, setEntryTime] = useState('08:00');
  const [lunchStartTime, setLunchStartTime] = useState('12:00');
  const [lunchEndTime, setLunchEndTime] = useState('13:00');
  const [exitTime, setExitTime] = useState('17:00');
  const [dailyTargetHours, setDailyTargetHours] = useState('8');

  const openNewModal = () => {
    setEditingSchedule(null);
    setName('');
    setType('5x2');
    setEntryTime('08:00');
    setLunchStartTime('12:00');
    setLunchEndTime('13:00');
    setExitTime('17:00');
    setDailyTargetHours('8');
    setModalOpen(true);
  };

  const openEditModal = (sch: WorkSchedule) => {
    setEditingSchedule(sch);
    setName(sch.name);
    setType(sch.type);
    setEntryTime(sch.entryTime);
    setLunchStartTime(sch.lunchStartTime);
    setLunchEndTime(sch.lunchEndTime);
    setExitTime(sch.exitTime);
    setDailyTargetHours(String(sch.dailyTargetMinutes / 60));
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome da jornada.');
      return;
    }

    const dailyTargetMinutes = Math.round(parseFloat(dailyTargetHours || '8') * 60);

    const saved: WorkSchedule = {
      id: editingSchedule?.id || `sched-${Date.now()}`,
      companyId: company.id,
      name,
      dailyTargetMinutes,
      entryTime,
      lunchStartTime,
      lunchEndTime,
      exitTime,
      type,
    };

    StorageService.saveWorkSchedule(saved);

    StorageService.addAuditLog({
      companyId: company.id,
      action: 'schedule_change',
      details: `${editingSchedule ? 'Atualizada' : 'Criada'} jornada de trabalho: ${name} (${entryTime} às ${exitTime})`,
      adminName: 'Administrador RH',
      adminEmail: 'rh@empresa.com.br',
      newValue: `${name} - ${dailyTargetHours}h diárias`,
    });

    setSchedules(StorageService.getWorkSchedules(company.id));
    setModalOpen(false);
    onRefresh();
    onShowToast('success', 'Jornada Salva', `A escala "${name}" foi configurada com sucesso.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Jornadas & Horários de Trabalho
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure as escalas de horário (5x2, 6x1, 12x36), intervalos obrigatórios e carga diária prevista da CLT.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Jornada</span>
        </button>
      </div>

      {/* Schedules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map((sch) => {
          const assignedEmployees = employees.filter((e) => e.workScheduleName.includes(sch.name) || e.dailyTargetMinutes === sch.dailyTargetMinutes);

          return (
            <div
              key={sch.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{sch.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                    Escala {sch.type}
                  </span>
                </div>

                {/* Hours row */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Horário Entrada:</span>
                    <span className="font-mono font-bold text-slate-800">{sch.entryTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Horário Saída:</span>
                    <span className="font-mono font-bold text-slate-800">{sch.exitTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Intervalo Almoço:</span>
                    <span className="font-mono font-bold text-slate-800">{sch.lunchStartTime} - {sch.lunchEndTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Carga Diária:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatMinutesToHours(sch.dailyTargetMinutes)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {assignedEmployees.length} colaboradores vinculados
                </span>

                <button
                  onClick={() => openEditModal(sch)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingSchedule ? 'Editar Jornada' : 'Cadastrar Nova Jornada'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Jornada *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Padrão Comercial (08h às 17h)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Escala</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="5x2">5x2 (Segunda a Sexta)</option>
                    <option value="6x1">6x1 (Comércio / Serviços)</option>
                    <option value="12x36">12x36 (Plantão)</option>
                    <option value="flexible">Flexível / Livre</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Carga Diária (Horas)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={dailyTargetHours}
                    onChange={(e) => setDailyTargetHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horário Entrada</label>
                  <input
                    type="time"
                    required
                    value={entryTime}
                    onChange={(e) => setEntryTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horário Saída</label>
                  <input
                    type="time"
                    required
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Início Almoço</label>
                  <input
                    type="time"
                    required
                    value={lunchStartTime}
                    onChange={(e) => setLunchStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fim Almoço</label>
                  <input
                    type="time"
                    required
                    value={lunchEndTime}
                    onChange={(e) => setLunchEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Jornada</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
