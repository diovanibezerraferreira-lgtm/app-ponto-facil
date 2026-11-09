import { PunchRecord, SyncHistoryEntry, TerminalStatus } from '../types';

const DB_NAME = 'PontoFacil_REP_Offline';
const DB_VERSION = 1;

const STORES = {
  PUNCHES: 'punches',
  SYNC_QUEUE: 'sync_queue',
  SYNC_HISTORY: 'sync_history',
  TERMINAL_META: 'terminal_meta',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB não suportado neste navegador'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: Marcações (Punches)
        if (!db.objectStoreNames.contains(STORES.PUNCHES)) {
          const punchStore = db.createObjectStore(STORES.PUNCHES, { keyPath: 'id' });
          punchStore.createIndex('companyId', 'companyId', { unique: false });
          punchStore.createIndex('employeeId', 'employeeId', { unique: false });
          punchStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          punchStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store 2: Fila de Sincronização (Sync Queue)
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'punchId' });
          queueStore.createIndex('companyId', 'companyId', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
        }

        // Store 3: Histórico de Sincronizações (Sync History)
        if (!db.objectStoreNames.contains(STORES.SYNC_HISTORY)) {
          const historyStore = db.createObjectStore(STORES.SYNC_HISTORY, { keyPath: 'id' });
          historyStore.createIndex('companyId', 'companyId', { unique: false });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store 4: Metadados do Terminal
        if (!db.objectStoreNames.contains(STORES.TERMINAL_META)) {
          db.createObjectStore(STORES.TERMINAL_META, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Falha ao abrir IndexedDB'));
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbPromise;
}

export const IndexedDBService = {
  isAvailable: isIndexedDBAvailable,

  /**
   * Salva uma marcação de ponto no IndexedDB local com tratamento de erros.
   */
  async savePunch(punch: PunchRecord): Promise<{ success: boolean; driver: 'indexedDB' | 'localStorage' }> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction([STORES.PUNCHES, STORES.SYNC_QUEUE], 'readwrite');
        const punchStore = tx.objectStore(STORES.PUNCHES);
        const queueStore = tx.objectStore(STORES.SYNC_QUEUE);

        const recordToStore: PunchRecord = {
          ...punch,
          storageDriver: 'indexedDB',
        };

        punchStore.put(recordToStore);

        if (punch.syncStatus === 'pending_sync') {
          queueStore.put({
            punchId: punch.id,
            companyId: punch.companyId,
            timestamp: punch.timestamp,
            addedAt: new Date().toISOString(),
            status: 'pending',
            attempts: 0,
          });
        }

        tx.oncomplete = () => {
          resolve({ success: true, driver: 'indexedDB' });
        };

        tx.onerror = () => {
          // Fallback para localStorage
          resolve({ success: true, driver: 'localStorage' });
        };
      });
    } catch {
      return { success: true, driver: 'localStorage' };
    }
  },

  /**
   * Obtém todas as marcações salvas no IndexedDB local
   */
  async getAllPunches(companyId?: string): Promise<PunchRecord[]> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.PUNCHES, 'readonly');
        const store = tx.objectStore(STORES.PUNCHES);
        const request = store.getAll();

        request.onsuccess = () => {
          let list: PunchRecord[] = request.result || [];
          if (companyId) {
            list = list.filter((p) => p.companyId === companyId);
          }
          list.sort((a, b) => b.timestamp - a.timestamp);
          resolve(list);
        };

        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * Retorna todas as marcações pendentes de sincronização em ordem cronológica (timestamp ASC)
   */
  async getPendingPunches(companyId?: string): Promise<PunchRecord[]> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.PUNCHES, 'readonly');
        const store = tx.objectStore(STORES.PUNCHES);
        const request = store.getAll();

        request.onsuccess = () => {
          let list: PunchRecord[] = request.result || [];
          list = list.filter((p) => p.syncStatus === 'pending_sync');
          if (companyId) {
            list = list.filter((p) => p.companyId === companyId);
          }
          // Sincronizar SEMPRE em ordem cronológica conforme especificado
          list.sort((a, b) => a.timestamp - b.timestamp);
          resolve(list);
        };

        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * Atualiza as marcações como sincronizadas após confirmação do servidor
   */
  async markPunchesAsSynced(punchIds: string[], syncedAt: string, batchId: string): Promise<number> {
    if (punchIds.length === 0) return 0;
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction([STORES.PUNCHES, STORES.SYNC_QUEUE], 'readwrite');
        const punchStore = tx.objectStore(STORES.PUNCHES);
        const queueStore = tx.objectStore(STORES.SYNC_QUEUE);
        let updatedCount = 0;

        punchIds.forEach((id) => {
          const req = punchStore.get(id);
          req.onsuccess = () => {
            const punch = req.result as PunchRecord | undefined;
            if (punch) {
              punch.syncStatus = 'synced';
              punch.syncedAt = syncedAt;
              punch.syncBatchId = batchId;
              punchStore.put(punch);
              queueStore.delete(id);
              updatedCount++;
            }
          };
        });

        tx.oncomplete = () => resolve(updatedCount);
        tx.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  },

  /**
   * Grava registro no histórico de auditoria de sincronização
   */
  async recordSyncHistory(entry: SyncHistoryEntry): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORES.SYNC_HISTORY, 'readwrite');
      tx.objectStore(STORES.SYNC_HISTORY).put(entry);
    } catch {
      // ignore
    }
  },

  /**
   * Retorna os registros do histórico de sincronização
   */
  async getSyncHistory(companyId?: string): Promise<SyncHistoryEntry[]> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.SYNC_HISTORY, 'readonly');
        const store = tx.objectStore(STORES.SYNC_HISTORY);
        const request = store.getAll();

        request.onsuccess = () => {
          let list: SyncHistoryEntry[] = request.result || [];
          if (companyId) {
            list = list.filter((h) => h.companyId === companyId);
          }
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(list);
        };

        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * Conta quantos registros estão pendentes no IndexedDB
   */
  async getPendingCount(companyId?: string): Promise<number> {
    const pendings = await IndexedDBService.getPendingPunches(companyId);
    return pendings.length;
  },

  /**
   * Limpa o banco IndexedDB (usado em reset geral de demonstração)
   */
  async clearAll(): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(
        [STORES.PUNCHES, STORES.SYNC_QUEUE, STORES.SYNC_HISTORY, STORES.TERMINAL_META],
        'readwrite'
      );
      tx.objectStore(STORES.PUNCHES).clear();
      tx.objectStore(STORES.SYNC_QUEUE).clear();
      tx.objectStore(STORES.SYNC_HISTORY).clear();
      tx.objectStore(STORES.TERMINAL_META).clear();
    } catch {
      // ignore
    }
  },
};
