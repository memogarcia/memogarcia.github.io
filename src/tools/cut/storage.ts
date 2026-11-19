// Cut — Local IndexedDB project & media autosave (100% browser-only).
import type { MediaRecord, SavedState } from './types.ts';

const DB_NAME = 'memo-cut-studio-v1';
const DB_VERSION = 1;
const STORE_META = 'project';
const STORE_MEDIA = 'media';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);

  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
        if (!db.objectStoreNames.contains(STORE_MEDIA)) db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function txDone(tx: IDBTransaction): Promise<boolean> {
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
    tx.onabort = () => resolve(false);
  });
}

function reqPromise<T>(req: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function write(stores: string | string[], fn: (tx: IDBTransaction) => void): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  try {
    const tx = db.transaction(stores, 'readwrite');
    fn(tx);
    return await txDone(tx);
  } catch {
    return false;
  }
}

export function saveMediaRecord(record: MediaRecord): Promise<boolean> {
  return write(STORE_MEDIA, (tx) => tx.objectStore(STORE_MEDIA).put(record));
}

export function deleteMediaRecord(id: string): Promise<boolean> {
  return write(STORE_MEDIA, (tx) => tx.objectStore(STORE_MEDIA).delete(id));
}

export function saveProjectState(state: SavedState): Promise<boolean> {
  return write(STORE_META, (tx) => tx.objectStore(STORE_META).put(state, 'current'));
}

export function clearAll(): Promise<boolean> {
  return write([STORE_META, STORE_MEDIA], (tx) => {
    tx.objectStore(STORE_META).clear();
    tx.objectStore(STORE_MEDIA).clear();
  });
}

export async function loadAll(): Promise<{ state: Partial<SavedState> | null; media: MediaRecord[] }> {
  const db = await openDb();
  if (!db) return { state: null, media: [] };
  try {
    const tx = db.transaction([STORE_META, STORE_MEDIA], 'readonly');
    const [state, media] = await Promise.all([
      reqPromise<Partial<SavedState> | undefined>(tx.objectStore(STORE_META).get('current')),
      reqPromise<MediaRecord[]>(tx.objectStore(STORE_MEDIA).getAll()),
    ]);
    return { state: state || null, media: Array.isArray(media) ? media : [] };
  } catch {
    return { state: null, media: [] };
  }
}

export const available = typeof indexedDB !== 'undefined';
