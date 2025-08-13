import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { DrillerProject } from '@/types'

interface DrillerDB extends DBSchema {
  projects: {
    key: string
    value: DrillerProject
    indexes: {
      'by-updated': string
      'by-created': string
    }
  }
  settings: {
    key: string
    value: {
      key: string
      value: any
      updatedAt: string
    }
  }
}

const DB_NAME = 'driller-db'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<DrillerDB> | null = null

export async function initDB(): Promise<IDBPDatabase<DrillerDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<DrillerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Projects store
      const projectStore = db.createObjectStore('projects', {
        keyPath: 'id'
      })
      projectStore.createIndex('by-updated', 'updatedAt')
      projectStore.createIndex('by-created', 'createdAt')

      // Settings store
      db.createObjectStore('settings', {
        keyPath: 'key'
      })
    }
  })

  return dbInstance
}

export async function saveProject(project: DrillerProject): Promise<void> {
  const db = await initDB()
  await db.put('projects', project)
}

export async function loadProject(id: string): Promise<DrillerProject | undefined> {
  const db = await initDB()
  return await db.get('projects', id)
}

export async function deleteProject(id: string): Promise<void> {
  const db = await initDB()
  await db.delete('projects', id)
}

export async function listProjects(): Promise<DrillerProject[]> {
  const db = await initDB()
  return await db.getAllFromIndex('projects', 'by-updated')
}

export async function duplicateProject(
  originalId: string, 
  newName: string
): Promise<DrillerProject | null> {
  const original = await loadProject(originalId)
  if (!original) return null

  const now = new Date().toISOString()
  const duplicated: DrillerProject = {
    ...original,
    id: crypto.randomUUID(),
    name: newName,
    createdAt: now,
    updatedAt: now,
  }

  await saveProject(duplicated)
  return duplicated
}

export async function exportProjectData(id: string): Promise<string | null> {
  const project = await loadProject(id)
  if (!project) return null
  
  return JSON.stringify(project, null, 2)
}

export async function importProjectData(jsonData: string): Promise<DrillerProject> {
  const project = JSON.parse(jsonData) as DrillerProject
  
  // Generate new ID and update timestamps
  const now = new Date().toISOString()
  const importedProject: DrillerProject = {
    ...project,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  
  await saveProject(importedProject)
  return importedProject
}

// Settings management
export async function saveSetting(key: string, value: any): Promise<void> {
  const db = await initDB()
  await db.put('settings', {
    key,
    value,
    updatedAt: new Date().toISOString()
  })
}

export async function loadSetting(key: string, defaultValue?: any): Promise<any> {
  const db = await initDB()
  const setting = await db.get('settings', key)
  return setting?.value ?? defaultValue
}

// Cleanup and maintenance
export async function clearAllData(): Promise<void> {
  const db = await initDB()
  
  const tx = db.transaction(['projects', 'settings'], 'readwrite')
  await Promise.all([
    tx.objectStore('projects').clear(),
    tx.objectStore('settings').clear(),
    tx.done
  ])
}