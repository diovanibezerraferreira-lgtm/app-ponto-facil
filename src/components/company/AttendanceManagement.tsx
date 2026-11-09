import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  Calendar,
  Filter,
  Check,
  X,
  Search,
  ExternalLink,
  Wifi,
  WifiOff,
  CloudUpload,
  Database,
} from 'lucide-react';
import { Employee, PunchRecord, AdjustmentRequest, Company, PunchType } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatDateBR,
  formatTimeHHMM,
  getPunchTypeLabel,
} from '../../utils/formatters';

interface AttendanceManagementProps {
  company: Company;
  employees: Employee[];
  punches: PunchRecord[];
  adjustments: AdjustmentRequest[];
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const AttendanceManagement: React.FC<AttendanceManagementProps> = ({
  company,
  employees,
  punches,
  adjustments,
  onRefresh,
  onShowToast,
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<
    'realtime' | 'offline_records' | 'adjustments' | 'manual'
  >('realtime');
  const [reviewerNote, setReviewerNote] = useState('');
  const [selectedAdjForReview, setSelectedAdjForReview] = useState<AdjustmentRequest | null>(null);

  // Manual Punch Form State
  const [manualEmployeeId, setManualEmployeeId] = useState(employees[0]?.id || '');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('08:00');
  const [manualType, setManualType] = useState<PunchType>('entry');
  const [manualReason, setManualReason] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Today's live stream of punches
  const todayPunches = punches
    .filter((p) => p.date === todayStr)
    .sort((a, b) => b.timestamp - a.timestamp);

  const pendingAdjustments = adjustments.filter((a) => a.status === 'pending');

  const handleReviewAdjustment = (id: string, status: 'approved' | 'rejected') => {
    StorageService.updateAdjustmentStatus(id, status, reviewerNote || undefined);
    onRefresh();
    setSelectedAdjForReview(null);
    setReviewerNote('');
    onShowToast(
      status === 'approved' ? 'success' : 'info',
      status === 'approved' ? 'Solicitação Aprovada!' : 'Solicitação Rejeitada',
      status === 'approved'
        ? 'O ponto foi automaticamente computado no espelho do colaborador.'
        : 'O colaborador receberá a justificativa.'
    );
  };

  const handleManualPunchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReason.trim()) {
      alert('Informe a justificativa legal para o lançamento manual.');
      return;
    }

    const targetEmp = employees.find((e) => e.id === manualEmployeeId);

    StorageService.addPunch({
      employeeId: manualEmployeeId,
      companyId: company.id,
      type: manualType,
      date: manualDate,
      time: manualTime + ':00',
      manualAdjustment: true,
      notes: `Lançamento manual pelo RH: ${manualReason}`,
      deviceInfo: 'Lançamento Manual pelo Gestor RH',
      registeredVia: 'admin_manual',
    });

    StorageService.addAuditLog({
      companyId: company.id,
      employeeId: manualEmployeeId,
      employeeName: targetEmp?.name || 'Colaborador',
      action: 'punch_manual_create',
      details: `Lançamento manual de ponto efetuado pelo administrador. Justificativa legal: ${manualReason}`,
      adminName: 'Mariana Castro (RH)',
      adminEmail: 'mariana@techsolucoes.com.br',
      oldValue: 'Sem marcação',
      newValue: `${manualDate} às ${manualTime} (${manualType})`,
    });

    onRefresh();
    setManualReason('');
    setSelectedSubTab('realtime');
    onShowToast('success', 'Registro Manual Salvo', 'Ponto inserido no espelho e registrado na auditoria.');
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSelectedSubTab('realtime')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedSubTab === 'realtime'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Monitor em Tempo Real</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => setSelectedSubTab('offline_records')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedSubTab === 'offline_records'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Marcações Feitas Offline (REP-P)</span>
          {punches.filter((p) => p.connectionStateAtPunch === 'offline' || !!p.syncedAt || p.syncStatus === 'pending_sync').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
              {punches.filter((p) => p.connectionStateAtPunch === 'offline' || !!p.syncedAt || p.syncStatus === 'pending_sync').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSelectedSubTab('adjustments')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
            selectedSubTab === 'adjustments'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Solicitações & Atestados</span>
          {pendingAdjustments.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {pendingAdjustments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSelectedSubTab('manual')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedSubTab === 'manual'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Lançamento Retroativo</span>
        </button>
      </div>

      {selectedSubTab === 'realtime' && (
        <div className="space-y-4">
          {/* Pending Offline Sync Notice Banner */}
          {punches.filter((p) => p.syncStatus === 'pending_sync').length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold">
                    {punches.filter((p) => p.syncStatus === 'pending_sync').length} marcação(ões) pendentes no terminal offline:
                  </span>
                  <p className="text-[11px] text-amber-800">
                    O tablet corporativo registrou pontos sem conexão com a internet. Os registros já estão protegidos localmente e atualizarão automaticamente os relatórios assim que houver rede.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const { syncedCount } = StorageService.syncPendingPunches(company.id);
                  onRefresh();
                  onShowToast(
                    'success',
                    'Sincronização Concluída',
                    `${syncedCount} marcação(ões) offline foram sincronizadas no relatório.`
                  );
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap self-start sm:self-auto transition-all"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Sincronizar Agora</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Marcações Realizadas Hoje ({formatDateBR(todayStr)})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total de {todayPunches.length} batidas registradas
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {todayPunches.map((punch) => {
                const emp = employees.find((e) => e.id === punch.employeeId);
                return (
                  <div
                    key={punch.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0">
                        {emp?.name.slice(0, 2) || 'CL'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {emp?.name || 'Colaborador'}
                          </span>
                          <span className="text-[10px] text-slate-500">• {emp?.role}</span>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-slate-500 mt-0.5">
                          <span className="font-semibold text-emerald-700">
                            {getPunchTypeLabel(punch.type)}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">NSR #{punch.nsr}</span>
                          {punch.manualAdjustment && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[9px]">
                              Ajuste Manual
                            </span>
                          )}
                          {punch.syncStatus === 'pending_sync' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[9px] flex items-center gap-1 animate-pulse">
                              <WifiOff className="w-2.5 h-2.5 text-amber-700" />
                              <span>Offline (Pendente Sinc.)</span>
                            </span>
                          )}
                          {punch.syncedAt && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[9px] flex items-center gap-1">
                              <CloudUpload className="w-2.5 h-2.5 text-blue-600" />
                              <span>Sincronizado da Nuvem</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {punch.location && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] max-w-xs truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{punch.location.addressText}</span>
                        </div>
                      )}
                      <div className="font-mono font-black text-base text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        {punch.time}
                      </div>
                    </div>
                  </div>
                );
              })}

              {todayPunches.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhuma marcação realizada até o momento no dia de hoje.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedSubTab === 'offline_records' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Auditoria de Registros Efetuados Offline (REP-P)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Conforme Portaria 671/2021 MTE: O registro em modo de contingência local mantém inviolável o horário original da batida, identificador do terminal físico e hash de assinatura.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                Terminal: {company.terminalName || 'Tablet Recepção'} ({company.terminalDeviceCode || 'TER-01'})
              </span>
            </div>
          </div>

          {/* Quick Metrics of Offline Operations */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Feitas Offline</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">
                {punches.filter((p) => p.connectionStateAtPunch === 'offline' || !!p.syncedAt || p.syncStatus === 'pending_sync').length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">No tablet corporativo</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Sincronizadas com Nuvem</span>
              <p className="text-xl font-black text-emerald-600 font-mono mt-1">
                {punches.filter((p) => p.syncStatus === 'synced' && (p.connectionStateAtPunch === 'offline' || !!p.syncedAt)).length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Consolidadas no Supabase</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase">Aguardando Conexão</span>
              <p className="text-xl font-black text-amber-600 font-mono mt-1">
                {punches.filter((p) => p.syncStatus === 'pending_sync').length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Armazenadas no IndexedDB</p>
            </div>
          </div>

          {/* Offline punches list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {punches
                .filter((p) => p.connectionStateAtPunch === 'offline' || !!p.syncedAt || p.syncStatus === 'pending_sync')
                .map((punch) => {
                  const emp = employees.find((e) => e.id === punch.employeeId);
                  const isPending = punch.syncStatus === 'pending_sync';

                  return (
                    <div
                      key={punch.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors text-xs"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center flex-shrink-0 ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {emp?.name.slice(0, 2) || 'CL'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {emp?.name || 'Colaborador'}
                            </span>
                            <span className="text-[10px] text-slate-500">• {emp?.role}</span>
                          </div>

                          <div className="flex items-center flex-wrap gap-2 text-slate-500 mt-1">
                            <span className="font-semibold text-emerald-700">
                              {getPunchTypeLabel(punch.type)}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">NSR #{punch.nsr}</span>
                            <span>•</span>
                            <span className="text-slate-600">
                              Terminal: <strong>{punch.terminalName || 'Tablet Recepção'}</strong> ({punch.terminalId || 'TER-01'})
                            </span>
                          </div>

                          {/* Audit Details */}
                          <div className="mt-1.5 flex items-center flex-wrap gap-2 text-[11px]">
                            {isPending ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold flex items-center gap-1 animate-pulse">
                                <WifiOff className="w-3 h-3 text-amber-700" />
                                <span>Gravado no IndexedDB • Aguardando Conexão</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                                <CloudUpload className="w-3 h-3 text-emerald-700" />
                                <span>
                                  Sincronizado na Nuvem {punch.syncedAt ? `em ${formatDateBR(punch.syncedAt.slice(0, 10))} às ${punch.syncedAt.slice(11, 16)}` : ''}
                                </span>
                              </span>
                            )}

                            <span className="text-slate-400 font-mono text-[10px]">
                              Hash: {punch.receiptHash.slice(0, 16)}...
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 self-end md:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Horário Original Batido:</span>
                          <span className="font-mono font-black text-base text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 block">
                            {formatDateBR(punch.date)} • {punch.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {punches.filter((p) => p.connectionStateAtPunch === 'offline' || !!p.syncedAt || p.syncStatus === 'pending_sync').length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhuma marcação gravada em modo offline até o momento. Utilize o Laboratório de Testes para simular uma queda de internet e registrar pontos offline.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedSubTab === 'adjustments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Aprovações Pendentes de Ajuste e Atestados
              </h3>
              <p className="text-xs text-slate-500">
                Avalie os pedidos enviados pelos colaboradores para inclusão de marcações esquecidas.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {adjustments.map((adj) => {
              const isPending = adj.status === 'pending';
              return (
                <div
                  key={adj.id}
                  className={`p-5 rounded-2xl border transition-all text-xs space-y-3 ${
                    isPending
                      ? 'bg-white border-amber-300 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{adj.employeeName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="font-semibold text-slate-700">
                        {getPunchTypeLabel(adj.punchType)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">
                        Data: {formatDateBR(adj.date)} às {adj.requestedTime}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          adj.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : adj.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {adj.status === 'approved'
                          ? 'Aprovado'
                          : adj.status === 'rejected'
                          ? 'Recusado'
                          : 'Aguardando Aprovação'}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="font-semibold text-slate-900 block mb-0.5">Justificativa:</span>
                    {adj.description}
                  </p>

                  {adj.attachmentName && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Documento Anexado: {adj.attachmentName}</span>
                    </div>
                  )}

                  {isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleReviewAdjustment(adj.id, 'rejected')}
                        className="px-3.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Recusar</span>
                      </button>
                      <button
                        onClick={() => handleReviewAdjustment(adj.id, 'approved')}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprovar e Lançar no Espelho</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {adjustments.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhuma solicitação de ajuste registrada no sistema.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedSubTab === 'manual' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-xl">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Lançamento Manual de Ponto Retroativo
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Utilize para incluir marcações de funcionários com justificativa legal conforme Art. 74 da CLT.
          </p>

          <form onSubmit={handleManualPunchSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Colaborador</label>
              <select
                value={manualEmployeeId}
                onChange={(e) => setManualEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role}) - {emp.registrationNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Horário (HH:mm)</label>
                <input
                  type="time"
                  required
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de Registro</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value as PunchType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="entry">1ª Entrada</option>
                <option value="lunch_start">1ª Saída (Intervalo)</option>
                <option value="lunch_end">2ª Entrada (Retorno)</option>
                <option value="exit">2ª Saída (Fim)</option>
                <option value="extra">Marcação Extra</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Justificativa Obrigatória
              </label>
              <textarea
                required
                rows={2}
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="Ex: Trabalho externo autorizado pela gerência, sem acesso ao app móvel."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs transition-colors"
            >
              Registrar Ponto Retroativo
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
