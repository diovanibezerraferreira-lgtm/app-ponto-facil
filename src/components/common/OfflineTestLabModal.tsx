import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  CloudUpload,
  CheckCircle2,
  Database,
  ArrowRight,
  RefreshCw,
  X,
  Play,
  RotateCcw,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Company, Employee, PunchRecord, SyncHistoryEntry } from '../../types';
import { StorageService } from '../../services/storage';
import { OfflineSyncService } from '../../services/offlineSyncService';
import { IndexedDBService } from '../../services/indexedDB';
import { formatDateBR } from '../../utils/formatters';

interface OfflineTestLabModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const OfflineTestLabModal: React.FC<OfflineTestLabModalProps> = ({
  company,
  isOpen,
  onClose,
  onRefreshData,
  onShowToast,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => OfflineSyncService.isOnline());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingPunches, setPendingPunches] = useState<PunchRecord[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [testLog, setTestLog] = useState<string[]>([]);

  const loadLabState = async () => {
    const currentOnline = OfflineSyncService.isOnline();
    setIsOnline(currentOnline);
    const pendings = await IndexedDBService.getPendingPunches(company.id);
    setPendingPunches(pendings);
    setPendingCount(pendings.length);
    const history = await IndexedDBService.getSyncHistory(company.id);
    setSyncHistory(history);
  };

  useEffect(() => {
    if (isOpen) {
      loadLabState();
      const unsub = OfflineSyncService.subscribe(() => {
        loadLabState();
      });
      return unsub;
    }
  }, [isOpen, company.id]);

  if (!isOpen) return null;

  const logMessage = (msg: string) => {
    setTestLog((prev) => [`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // STEP 1: Punch while online
  const handleTestOnlinePunch = async () => {
    if (!isOnline) {
      OfflineSyncService.setSimulatedOffline(false);
      setIsOnline(true);
    }

    const employees = StorageService.getEmployees(company.id).filter((e) => e.status === 'active');
    const emp = employees[0] || { id: 'emp-claudilene', name: 'Claudilene Souza' };

    logMessage(`Registrando ponto online para ${emp.name}...`);
    const result = await OfflineSyncService.recordPunch({
      employeeId: emp.id,
      companyId: company.id,
      type: 'entry',
      deviceInfo: 'Tablet Recepção (TER-01) - Teste Online',
      registeredVia: 'kiosk_terminal',
    });

    logMessage(`Ponto online gravado e sincronizado imediatamente (NSR #${result.punch.nsr})!`);
    onShowToast('success', 'Ponto Online Gravado', `Marcação de ${emp.name} salva e sincronizada na nuvem.`);
    setActiveStep(2);
    loadLabState();
    onRefreshData();
  };

  // STEP 2: Disconnect internet
  const handleDisconnect = () => {
    OfflineSyncService.setSimulatedOffline(true);
    setIsOnline(false);
    logMessage('Internet desconectada! Dispositivo operando em MODO OFFLINE.');
    onShowToast('info', 'Modo Offline Ativado', 'O aparelho agora está sem conexão com a internet.');
    setActiveStep(3);
    loadLabState();
  };

  // STEP 3: Record multiple offline punches in IndexedDB
  const handleRecordMultipleOffline = async () => {
    if (isOnline) {
      OfflineSyncService.setSimulatedOffline(true);
      setIsOnline(false);
    }

    const employees = StorageService.getEmployees(company.id).filter((e) => e.status === 'active');
    const claudilene = employees.find((e) => e.name.toLowerCase().includes('claudilene')) || employees[0];
    const lucas = employees.find((e) => e.name.toLowerCase().includes('lucas')) || employees[1] || employees[0];

    logMessage(`Gravando lote de pontos offline no IndexedDB local...`);

    // Punch 1
    const p1 = await OfflineSyncService.recordPunch({
      employeeId: claudilene.id,
      companyId: company.id,
      type: 'lunch_start',
      deviceInfo: 'Tablet Recepção (TER-01) - Modo Offline IndexedDB',
      registeredVia: 'kiosk_terminal',
    });
    logMessage(`1/2: ${claudilene.name} registrou 1ª Saída (NSR #${p1.punch.nsr}) [IndexedDB Pendente]`);

    // Small delay to simulate separate punches
    await new Promise((r) => setTimeout(r, 400));

    // Punch 2
    const p2 = await OfflineSyncService.recordPunch({
      employeeId: lucas.id,
      companyId: company.id,
      type: 'lunch_end',
      deviceInfo: 'Tablet Recepção (TER-01) - Modo Offline IndexedDB',
      registeredVia: 'kiosk_terminal',
    });
    logMessage(`2/2: ${lucas.name} registrou 2ª Entrada (NSR #${p2.punch.nsr}) [IndexedDB Pendente]`);

    onShowToast(
      'info',
      'Pontos Offline Gravados!',
      `2 marcações salvas no IndexedDB local aguardando conexão.`
    );

    setActiveStep(4);
    await loadLabState();
    onRefreshData();
  };

  // STEP 4: Reconnect internet and run automatic sync
  const handleReconnectAndSync = async () => {
    setIsSyncing(true);
    logMessage('Internet reconectada! Disparando sincronização automática com Supabase...');
    OfflineSyncService.setSimulatedOffline(false);
    setIsOnline(true);

    const syncResult = await OfflineSyncService.syncPendingPunches(company.id);
    setIsSyncing(false);

    if (syncResult.success) {
      logMessage(`Sincronização concluída com sucesso! ${syncResult.syncedCount} marcação(ões) enviadas em ordem cronológica.`);
      onShowToast(
        'success',
        'Sincronização Concluída!',
        `${syncResult.syncedCount} marcação(ões) enviadas sem duplicidade para os relatórios.`
      );
      setActiveStep(5);
    } else {
      logMessage(`Erro de sincronização: ${syncResult.errorMessage}`);
    }

    await loadLabState();
    onRefreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full text-slate-100 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Laboratório de Teste Offline & Sincronização</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  IndexedDB + Supabase
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Teste passo a passo todos os requisitos de contingência offline e envio cronológico
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Top Live Dashboard Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Connection state */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status da Rede</span>
                <span className={`text-sm font-extrabold flex items-center gap-1.5 mt-0.5 ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />}
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  OfflineSyncService.setSimulatedOffline(isOnline);
                  setIsOnline(!isOnline);
                }}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                Alternar
              </button>
            </div>

            {/* 2. Pending queue in IndexedDB */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fila no IndexedDB</span>
                <span className="text-sm font-black text-amber-400 mt-0.5 font-mono flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-400" />
                  {pendingCount} pendente(s)
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Local Cache</span>
            </div>

            {/* 3. Sync status */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Servidor Supabase</span>
                <span className="text-sm font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  {isSyncing ? <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  {isSyncing ? 'Sincronizando...' : 'Conectado'}
                </span>
              </div>
              <button
                disabled={!isOnline || isSyncing || pendingCount === 0}
                onClick={() => handleReconnectAndSync()}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 disabled:opacity-40"
              >
                Sincronizar
              </button>
            </div>
          </div>

          {/* Interactive 5-Step Automated Workflow Guide */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Roteiro de Validação dos 6 Requisitos Oficiais:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Step 1 */}
              <div className={`p-3 rounded-xl border transition-all ${activeStep === 1 ? 'bg-slate-800/80 border-emerald-500/80' : 'bg-slate-900/60 border-slate-800/80'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-200">1. Registrar Ponto com Internet</span>
                  {activeStep > 1 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Testa o registro normal conectado. O ponto é salvo e sincronizado na nuvem imediatamente.
                </p>
                <button
                  type="button"
                  onClick={handleTestOnlinePunch}
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Executar Teste Online</span>
                </button>
              </div>

              {/* Step 2 */}
              <div className={`p-3 rounded-xl border transition-all ${activeStep === 2 ? 'bg-slate-800/80 border-amber-500/80' : 'bg-slate-900/60 border-slate-800/80'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-200">2. Desconectar a Internet</span>
                  {activeStep > 2 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Simula o tablet corporativo sem conexão Wi-Fi/4G. O terminal entra em modo offline.
                </p>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="w-full py-1.5 px-3 bg-amber-950/70 hover:bg-amber-900 border border-amber-700/60 text-amber-200 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Desconectar Internet (Simular Queda)</span>
                </button>
              </div>

              {/* Step 3 */}
              <div className={`p-3 rounded-xl border transition-all ${activeStep === 3 ? 'bg-slate-800/80 border-amber-500/80' : 'bg-slate-900/60 border-slate-800/80'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-200">3. Bater Vários Pontos Offline</span>
                  {activeStep > 3 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Grava 2 pontos (Claudilene e Lucas) direto no IndexedDB sem bloquear por falta de rede.
                </p>
                <button
                  type="button"
                  onClick={handleRecordMultipleOffline}
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gravar Batidas Offline no IndexedDB</span>
                </button>
              </div>

              {/* Step 4 */}
              <div className={`p-3 rounded-xl border transition-all ${activeStep >= 4 ? 'bg-slate-800/80 border-emerald-500/80' : 'bg-slate-900/60 border-slate-800/80'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-200">4. Reconectar e Sincronizar</span>
                  {activeStep === 5 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Detecta a rede, envia as marcações em ordem cronológica e impede duplicidades.
                </p>
                <button
                  type="button"
                  onClick={handleReconnectAndSync}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg font-black text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/30"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Reconectar & Sincronizar com Supabase</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pending Punches in IndexedDB Inspection Table */}
          {pendingPunches.length > 0 && (
            <div className="bg-slate-950 rounded-2xl border border-amber-800/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-amber-200">
                    Marcações Salvas Localmente no IndexedDB ({pendingPunches.length})
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-bold border border-amber-700/60">
                  Aguardando Conexão
                </span>
              </div>

              <div className="divide-y divide-slate-800/60 text-[11px]">
                {pendingPunches.map((punch) => {
                  const emp = StorageService.getEmployeeById(punch.employeeId);
                  return (
                    <div key={punch.id} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">{emp?.name || punch.employeeId}</span>
                        <span className="text-slate-400 ml-2">• {punch.type}</span>
                        <span className="text-amber-400 ml-2 font-mono">NSR #{punch.nsr}</span>
                      </div>
                      <div className="font-mono text-slate-300">
                        {formatDateBR(punch.date)} às {punch.time} (Gravado Offline)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-time Execution Log */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-bold">
              <span>Log de Eventos do Motor de Sincronização:</span>
              <button
                type="button"
                onClick={() => setTestLog([])}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Limpar Log
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-emerald-400 space-y-1 max-h-36 overflow-y-auto">
              {testLog.length === 0 ? (
                <span className="text-slate-500">Clique nas etapas acima para acompanhar o log de sincronização em tempo real...</span>
              ) : (
                testLog.map((line, idx) => <p key={idx}>{line}</p>)
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Conforme Portaria 671 MTE: O registro offline preserva data, hora original e hash legal.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Fechar Laboratório
          </button>
        </div>
      </div>
    </div>
  );
};
