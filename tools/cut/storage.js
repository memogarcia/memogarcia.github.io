// Cut — Local IndexedDB project & media autosave (100% browser-only).
(() => {
  'use strict';

  const DB_NAME = 'memo-cut-studio-v1';
  const DB_VERSION = 1;
  const STORE_META = 'project';
  const STORE_MEDIA = 'media';

  let dbPromise = null;

  function openDb() {
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

  function txDone(tx) {
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    });
  }

  function reqPromise(req) {
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async function saveMediaRecord(record) {
    const db = await openDb();
    if (!db) return false;
    try {
      const tx = db.transaction(STORE_MEDIA, 'readwrite');
      tx.objectStore(STORE_MEDIA).put(record);
      return await txDone(tx);
    } catch {
      return false;
    }
  }

  async function deleteMediaRecord(id) {
    const db = await openDb();
    if (!db) return false;
    try {
      const tx = db.transaction(STORE_MEDIA, 'readwrite');
      tx.objectStore(STORE_MEDIA).delete(id);
      return await txDone(tx);
    } catch {
      return false;
    }
  }

  async function saveProjectState(state) {
    const db = await openDb();
    if (!db) return false;
    try {
      const tx = db.transaction(STORE_META, 'readwrite');
      tx.objectStore(STORE_META).put(state, 'current');
      return await txDone(tx);
    } catch {
      return false;
    }
  }

  async function loadAll() {
    const db = await openDb();
    if (!db) return { state: null, media: [] };
    try {
      const tx = db.transaction([STORE_META, STORE_MEDIA], 'readonly');
      const [state, media] = await Promise.all([
        reqPromise(tx.objectStore(STORE_META).get('current')),
        reqPromise(tx.objectStore(STORE_MEDIA).getAll()),
      ]);
      return { state: state || null, media: Array.isArray(media) ? media : [] };
    } catch {
      return { state: null, media: [] };
    }
  }

  async function clearAll() {
    const db = await openDb();
    if (!db) return false;
    try {
      const tx = db.transaction([STORE_META, STORE_MEDIA], 'readwrite');
      tx.objectStore(STORE_META).clear();
      tx.objectStore(STORE_MEDIA).clear();
      return await txDone(tx);
    } catch {
      return false;
    }
  }

  window.CutStorage = {
    saveMediaRecord,
    deleteMediaRecord,
    saveProjectState,
    loadAll,
    clearAll,
  };
})();
