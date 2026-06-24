'use client';

/**
 * On-device photo storage in IndexedDB.
 *
 * Profile photos are by far the largest thing the app holds (~tens of KB each),
 * and localStorage caps out around ~5 MB — enough photos could push game data
 * past the quota and cause silent save failures. So photos live in IndexedDB
 * (which has a far larger budget) keyed by player id, while the persisted
 * localStorage state keeps only the lightweight game data. Photos are merged
 * back into the in-memory player objects on startup, so the rest of the app
 * keeps reading `player.photo` synchronously, exactly as before.
 *
 * Everything here is best-effort and dependency-free: if IndexedDB is missing
 * (old browser, some private modes, SSR, tests), callers fall back gracefully
 * and the store keeps photos in localStorage instead.
 */

const DB_NAME = 'open-pickleball';
const STORE = 'photos';

/** True when IndexedDB is usable in this environment. */
export function photosAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (!photosAvailable()) return resolve(null);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, 1);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

/** Read every stored photo as a { playerId: dataUrl } map (empty if unavailable). */
export async function getAllPhotos(): Promise<Record<string, string>> {
  const db = await openDb();
  if (!db) return {};
  return new Promise((resolve) => {
    const out: Record<string, string> = {};
    const store = tx(db, 'readonly');
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        if (typeof cursor.value === 'string') out[String(cursor.key)] = cursor.value;
        cursor.continue();
      } else {
        db.close();
        resolve(out);
      }
    };
    cursorReq.onerror = () => {
      db.close();
      resolve(out);
    };
  });
}

/** Store (or replace) a player's photo. Resolves false on failure. */
export async function putPhoto(id: string, dataUrl: string): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const store = tx(db, 'readwrite');
      store.put(dataUrl, id);
      store.transaction.oncomplete = () => {
        db.close();
        resolve(true);
      };
      store.transaction.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

/** Delete a player's photo (no-op if absent). */
export async function deletePhoto(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const store = tx(db, 'readwrite');
    store.delete(id);
    store.transaction.oncomplete = () => resolve();
    store.transaction.onerror = () => resolve();
  });
  db.close();
}

/** Wipe all stored photos. */
export async function clearPhotos(): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const store = tx(db, 'readwrite');
    store.clear();
    store.transaction.oncomplete = () => resolve();
    store.transaction.onerror = () => resolve();
  });
  db.close();
}
