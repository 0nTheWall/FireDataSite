// Minimal IndexedDB wrapper for AfterFire.
// Stores incidents and assessments (including base64 photos) so records
// survive a page refresh. No external dependencies.

import type { Assessment, Incident } from '../types'

const DB_NAME = 'afterfire'
const DB_VERSION = 1
const STORE_INCIDENTS = 'incidents'
const STORE_ASSESSMENTS = 'assessments'
const STORE_META = 'meta'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_INCIDENTS)) {
        db.createObjectStore(STORE_INCIDENTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_ASSESSMENTS)) {
        const store = db.createObjectStore(STORE_ASSESSMENTS, { keyPath: 'id' })
        store.createIndex('incidentId', 'incidentId', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode)
        const store = transaction.objectStore(storeName)
        const request = fn(store)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

function getAll<T>(storeName: string): Promise<T[]> {
  return tx<T[]>(storeName, 'readonly', (store) => store.getAll() as IDBRequest<T[]>)
}

// ---- Incidents ----

export async function getAllIncidents(): Promise<Incident[]> {
  return getAll<Incident>(STORE_INCIDENTS)
}

export async function putIncident(incident: Incident): Promise<void> {
  await tx(STORE_INCIDENTS, 'readwrite', (s) => s.put(incident))
}

export async function putIncidents(incidents: Incident[]): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_INCIDENTS, 'readwrite')
    const store = transaction.objectStore(STORE_INCIDENTS)
    incidents.forEach((i) => store.put(i))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function deleteIncident(id: string): Promise<void> {
  await tx(STORE_INCIDENTS, 'readwrite', (s) => s.delete(id))
}

// ---- Assessments ----

export async function getAllAssessments(): Promise<Assessment[]> {
  return getAll<Assessment>(STORE_ASSESSMENTS)
}

export async function putAssessment(a: Assessment): Promise<void> {
  await tx(STORE_ASSESSMENTS, 'readwrite', (s) => s.put(a))
}

export async function putAssessments(list: Assessment[]): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_ASSESSMENTS, 'readwrite')
    const store = transaction.objectStore(STORE_ASSESSMENTS)
    list.forEach((a) => store.put(a))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function deleteAssessment(id: string): Promise<void> {
  await tx(STORE_ASSESSMENTS, 'readwrite', (s) => s.delete(id))
}

// ---- Meta (key/value) ----

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await tx<{ key: string; value: T } | undefined>(
    STORE_META,
    'readonly',
    (s) => s.get(key) as IDBRequest<{ key: string; value: T } | undefined>,
  )
  return row?.value
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  await tx(STORE_META, 'readwrite', (s) => s.put({ key, value }))
}
