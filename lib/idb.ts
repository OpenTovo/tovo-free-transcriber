import { openDB, DBSchema, IDBPDatabase } from 'idb'

// Database schema for the entire application
export interface AppDB extends DBSchema {
  models: {
    key: string // model name
    value: {
      name: string
      size: number
      chunks: number
      downloadedAt: number
      version: string
    }
  }
  chunks: {
    key: string // `${modelName}-${chunkIndex}`
    value: {
      key: string // Composite key for the chunk
      modelName: string
      chunkIndex: number
      data: Uint8Array
    }
    indexes: {
      modelName: string // Index on modelName
    }
  }
  // Future tables can be added here
  // settings: {
  //   key: string
  //   value: any
  // }
  // history: {
  //   key: string
  //   value: {
  //     id: string
  //     timestamp: number
  //     data: any
  //   }
  // }
}

// Database configuration
const DB_NAME = 'tovo-transcriber'
const DB_VERSION = 1 // only integer allowed

class DatabaseManager {
  private db: IDBPDatabase<AppDB> | null = null
  private dbPromise: Promise<IDBPDatabase<AppDB>> | null = null

  async getDB(): Promise<IDBPDatabase<AppDB>> {
    if (this.db) return this.db

    if (!this.dbPromise) {
      this.dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`Upgrading database from ${oldVersion} to ${newVersion}`)

          // Create models store
          if (!db.objectStoreNames.contains('models')) {
            const modelsStore = db.createObjectStore('models', { keyPath: 'name' })
            console.log('Created models store')
          }

          // Create chunks store
          if (!db.objectStoreNames.contains('chunks')) {
            const chunksStore = db.createObjectStore('chunks', { keyPath: 'key' })
            chunksStore.createIndex('modelName', 'modelName', { unique: false })
            console.log('Created chunks store with modelName index')
          }

          // Future store creation can be added here
          // if (!db.objectStoreNames.contains('settings')) {
          //   db.createObjectStore('settings', { keyPath: 'key' })
          // }
        },
        blocked() {
          console.warn('Database upgrade blocked by another connection')
        },
        blocking() {
          console.warn('Database connection is blocking an upgrade')
        },
      })
    }

    this.db = await this.dbPromise
    return this.db
  }

  // Generic methods for common database operations
  async get<T extends keyof AppDB>(
    storeName: T,
    key: AppDB[T]['key']
  ): Promise<AppDB[T]['value'] | undefined> {
    const db = await this.getDB()
    return db.get(storeName as any, key)
  }

  async getAll<T extends keyof AppDB>(storeName: T): Promise<AppDB[T]['value'][]> {
    const db = await this.getDB()
    return db.getAll(storeName as any)
  }

  async put<T extends keyof AppDB>(
    storeName: T,
    value: AppDB[T]['value']
  ): Promise<AppDB[T]['key']> {
    const db = await this.getDB()
    return db.put(storeName as any, value)
  }

  async delete<T extends keyof AppDB>(storeName: T, key: AppDB[T]['key']): Promise<void> {
    const db = await this.getDB()
    return db.delete(storeName as any, key)
  }

  async transaction<T extends keyof AppDB>(
    storeNames: T[],
    mode: IDBTransactionMode,
    callback: (tx: any) => Promise<void>
  ): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(storeNames as any, mode)
    await callback(tx)
    await tx.done
  }

  // Utility methods
  async clear(): Promise<void> {
    const db = await this.getDB()
    const storeNames = ['models', 'chunks'] as const

    const tx = db.transaction(storeNames, 'readwrite')
    await Promise.all(storeNames.map(storeName => tx.objectStore(storeName).clear()))
    await tx.done
  }
  async getDatabaseSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    }
    return 0
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.dbPromise = null
    }
  }
}

// Export singleton instance
export const db = new DatabaseManager()

// Export types for use in other modules
export { DB_NAME, DB_VERSION }
export type AppDatabase = AppDB
