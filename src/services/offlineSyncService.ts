import { PunchRecord, SyncHistoryEntry, TerminalStatus, Company } from '../types';
import { IndexedDBService } from './indexedDB';
import { StorageService } from './storage';

type SyncListener = (event: {
  type: 'sync_start' | 'sync_success' | 'sync_failed' | 'status_change';
  pendingCount: number;
  syncedCount?: number;
  isOnline: boolean;
  historyEntry?: SyncHistoryEntry;
}) => void;

class OfflineSyncManager {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        StorageService.setSimulatedOffline(false);
        this.notifyStatusChange();
        this.syncPendingPunches();
      });

      window.addEventListener('offline', () => {
        this.notifyStatusChange();
      });

      // Heartbeat check every 15s to auto-retry synchronization if connection is healthy
      this.heartbeatInterval = setInterval(() => {
        if (this.isOnline() && !this.isSyncing) {
          this.syncPendingPunches();
        }
      }, 15000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(data: Parameters<SyncListener>[0]) {
    this.listeners.forEach((l) => {
      try {
        l(data);
      } catch {
        // ignore listener errors
      }
    });
  }

  public isOnline(): boolean {
    return StorageService.isOnline();
  }

  public setSimulatedOffline(offline: boolean) {
    StorageService.setSimulatedOffline(offline);
    this.notifyStatusChange();
    if (!offline) {
      // Returned online -> immediately sync pending records
      this.syncPendingPunches();
    }
  }

  public notifyStatusChange() {
    const isOnline = this.isOnline();
    const companyId = StorageService.getKioskCompanyId();
    const pendingCount = StorageService.getPendingSyncCount(companyId);
    this.notify({
      type: 'status_change',
      isOnline,
      pendingCount,
    });
  }

  /**
   * Registra um novo ponto offline ou online com persistência dupla em IndexedDB e Storage.
   */
  public async recordPunch(data: {
    employeeId: string;
    companyId: string;
    type: PunchRecord['type'];
    location?: PunchRecord['location'];
    deviceInfo?: string;
    registeredVia?: 'kiosk_terminal' | 'admin_manual';
  }): Promise<{ punch: PunchRecord; isOffline: boolean }> {
    const isOnlineNow = this.isOnline();
    const syncStatus: 'synced' | 'pending_sync' = isOnlineNow ? 'synced' : 'pending_sync';
    const connectionStateAtPunch: 'offline' | 'online' = isOnlineNow ? 'online' : 'offline';

    // Salva no storage geral
    const newPunch = StorageService.addPunch({
      ...data,
      syncStatus,
    });

    // Enriquece com informações de auditoria de rede e terminal
    newPunch.connectionStateAtPunch = connectionStateAtPunch;
    newPunch.terminalId = 'TER-01';
    newPunch.terminalName = 'Tablet Recepção';

    // Salva também no IndexedDB nativo de forma assíncrona
    await IndexedDBService.savePunch(newPunch);

    this.notifyStatusChange();

    // Se estiver online, garante que os dados estão consolidados
    if (isOnlineNow) {
      setTimeout(() => this.syncPendingPunches(data.companyId), 300);
    }

    return {
      punch: newPunch,
      isOffline: !isOnlineNow,
    };
  }

  /**
   * Executa a sincronização segura de todas as marcações pendentes em ordem cronológica.
   */
  public async syncPendingPunches(
    companyId?: string
  ): Promise<{ success: boolean; syncedCount: number; errorMessage?: string }> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, errorMessage: 'Sincronização já em andamento' };
    }

    if (!this.isOnline()) {
      return { success: false, syncedCount: 0, errorMessage: 'Dispositivo sem conexão com a internet' };
    }

    this.isSyncing = true;
    const targetCompId = companyId || StorageService.getKioskCompanyId();
    const startTime = Date.now();

    this.notify({
      type: 'sync_start',
      isOnline: true,
      pendingCount: StorageService.getPendingSyncCount(targetCompId),
    });

    try {
      // 1. Coleta marcações pendentes locais (IndexedDB e Storage)
      const pendingFromIndexedDB = await IndexedDBService.getPendingPunches(targetCompId);
      const allPunches = StorageService.getPunches();

      // De-duplicação por ID
      const pendingMap = new Map<string, PunchRecord>();
      pendingFromIndexedDB.forEach((p) => pendingMap.set(p.id, p));
      allPunches
        .filter((p) => p.syncStatus === 'pending_sync' && (!targetCompId || p.companyId === targetCompId))
        .forEach((p) => pendingMap.set(p.id, p));

      const pendingList = Array.from(pendingMap.values());

      // Ordenar em ordem cronológica estrita (timestamp ASC) conforme especificação legal
      pendingList.sort((a, b) => a.timestamp - b.timestamp);

      if (pendingList.length === 0) {
        this.isSyncing = false;
        this.notifyStatusChange();
        return { success: true, syncedCount: 0 };
      }

      // Simulação de latência de envio seguro para API Supabase
      await new Promise((r) => setTimeout(r, 800));

      const nowIso = new Date().toISOString();
      const batchId = `sync-batch-${Date.now()}`;
      const syncedIds: string[] = [];

      // 2. Atualizar no Storage e no IndexedDB
      const updatedPunches = allPunches.map((p) => {
        if (pendingMap.has(p.id)) {
          syncedIds.push(p.id);
          return {
            ...p,
            syncStatus: 'synced' as const,
            syncedAt: nowIso,
            syncBatchId: batchId,
          };
        }
        return p;
      });

      StorageService.setRawPunches(updatedPunches);

      // Marca como sincronizado no IndexedDB
      await IndexedDBService.markPunchesAsSynced(syncedIds, nowIso, batchId);

      // 3. Registra histórico da sincronização para auditoria
      const historyEntry: SyncHistoryEntry = {
        id: `synchist-${Date.now()}`,
        companyId: targetCompId,
        terminalId: 'TER-01',
        terminalName: 'Tablet Recepção',
        timestamp: nowIso,
        syncedCount: syncedIds.length,
        punchIds: syncedIds,
        status: 'success',
        durationMs: Date.now() - startTime,
      };

      await IndexedDBService.recordSyncHistory(historyEntry);

      // Atualiza última sincronização no storage da empresa
      const company = StorageService.getCompanyById(targetCompId);
      StorageService.addAuditLog({
        companyId: targetCompId,
        action: 'kiosk_sync',
        details: `Sincronização automática bem-sucedida: ${syncedIds.length} marcação(ões) offline enviadas em ordem cronológica pelo terminal Tablet Recepção (TER-01).`,
        adminName: 'Serviço de Sincronização Automática (Supabase REP)',
        adminEmail: 'sync@pontofacil.com.br',
        newValue: `${syncedIds.length} registros sincronizados (Lote: ${batchId})`,
      });

      this.isSyncing = false;

      this.notify({
        type: 'sync_success',
        isOnline: true,
        pendingCount: 0,
        syncedCount: syncedIds.length,
        historyEntry,
      });

      return {
        success: true,
        syncedCount: syncedIds.length,
      };
    } catch (err: any) {
      this.isSyncing = false;
      const historyEntry: SyncHistoryEntry = {
        id: `synchist-err-${Date.now()}`,
        companyId: targetCompId,
        terminalId: 'TER-01',
        terminalName: 'Tablet Recepção',
        timestamp: new Date().toISOString(),
        syncedCount: 0,
        punchIds: [],
        status: 'failed',
        errorMessage: err?.message || 'Falha na conexão durante envio para o Supabase',
        durationMs: Date.now() - startTime,
      };

      await IndexedDBService.recordSyncHistory(historyEntry);

      this.notify({
        type: 'sync_failed',
        isOnline: this.isOnline(),
        pendingCount: StorageService.getPendingSyncCount(targetCompId),
      });

      return {
        success: false,
        syncedCount: 0,
        errorMessage: historyEntry.errorMessage,
      };
    }
  }

  /**
   * Obtém status detalhado do terminal corporativo para o painel do gestor.
   */
  public async getTerminalStatus(companyId: string): Promise<TerminalStatus> {
    const isOnline = this.isOnline();
    const pendingPunchesCount = StorageService.getPendingSyncCount(companyId);
    const punches = StorageService.getPunches(companyId);
    const totalSyncedCount = punches.filter((p) => p.syncStatus === 'synced').length;

    const history = await IndexedDBService.getSyncHistory(companyId);
    const lastSyncAt = history[0]?.timestamp || (punches.find((p) => !!p.syncedAt)?.syncedAt);

    return {
      companyId,
      terminalId: 'TER-01',
      terminalName: 'Tablet Recepção',
      isOnline,
      lastHeartbeat: new Date().toISOString(),
      lastSyncAt,
      pendingPunchesCount,
      totalSyncedCount,
    };
  }

  /**
   * Simula um lote de marcações offline para testes interativos.
   */
  public async simulateOfflinePunchBatch(companyId: string): Promise<PunchRecord[]> {
    const employees = StorageService.getEmployees(companyId).filter((e) => e.status === 'active');
    if (employees.length === 0) return [];

    // Desconecta a internet
    this.setSimulatedOffline(true);

    const now = new Date();
    const punchesCreated: PunchRecord[] = [];

    // Cria 2 batidas de exemplo em horários realistas
    const claudilene = employees.find((e) => e.name.toLowerCase().includes('claudilene')) || employees[0];
    const lucas = employees.find((e) => e.name.toLowerCase().includes('lucas')) || employees[1] || employees[0];

    const p1 = await this.recordPunch({
      employeeId: claudilene.id,
      companyId,
      type: 'entry',
      deviceInfo: 'Tablet Recepção (TER-01) - Modo Offline',
      registeredVia: 'kiosk_terminal',
    });
    punchesCreated.push(p1.punch);

    if (lucas && lucas.id !== claudilene.id) {
      const p2 = await this.recordPunch({
        employeeId: lucas.id,
        companyId,
        type: 'lunch_start',
        deviceInfo: 'Tablet Recepção (TER-01) - Modo Offline',
        registeredVia: 'kiosk_terminal',
      });
      punchesCreated.push(p2.punch);
    }

    return punchesCreated;
  }
}

export const OfflineSyncService = new OfflineSyncManager();
