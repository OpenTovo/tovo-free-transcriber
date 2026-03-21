import { db } from './idb'

// Available whisper models
export const WHISPER_MODELS = {
  tiny: {
    name: 'Tiny Multilingual',
    description: 'Fast, supports multiple languages (~32MB)',
    url: 'quantized/ggml-tiny-q5_1.bin',
    size: 32 * 1024 * 1024,
    timeMultiplier: 0.15,
  },
  base: {
    name: 'Base Multilingual',
    description: 'Good balance of speed and accuracy (~60MB)',
    url: 'quantized/ggml-base-q5_1.bin',
    size: 60 * 1024 * 1024,
    timeMultiplier: 0.2,
  },
  small: {
    name: 'Small Multilingual',
    description: 'Best accuracy, supports multiple languages (~190MB)',
    url: 'quantized/ggml-small-q5_1.bin',
    size: 190 * 1024 * 1024,
    timeMultiplier: 0.35,
  },
} as const

export type WhisperModelKey = keyof typeof WHISPER_MODELS

// Default model to use
export const DEFAULT_MODEL: WhisperModelKey = 'base'

export const MAX_DURATION_SECONDS = 30 * 60 // 30 minutes

// Helper function to get model size in MB
export const getModelSizeMB = (modelKey: WhisperModelKey): number => {
  return Math.round(WHISPER_MODELS[modelKey].size / (1024 * 1024))
}

// Helper function to estimate transcription time in seconds
export const estimateTranscriptionTime = (
  modelKey: WhisperModelKey,
  audioDurationSeconds: number
): number => {
  // Non-linear estimation based on observed performance:
  // Short audio: 12s -> 5s (0.42x)
  // Long audio: 240s -> 40s (0.17x)
  // Use a base multiplier + overhead approach
  const baseMultiplier = WHISPER_MODELS[modelKey].timeMultiplier
  const overheadSeconds = audioDurationSeconds < 60 ? 10 : 20 // More overhead for short clips

  const estimatedTime = Math.round(audioDurationSeconds * baseMultiplier + overheadSeconds)
  return Math.max(5, estimatedTime) // Minimum 5 seconds
}

// Chunk size for storing large files (50MB chunks)
const CHUNK_SIZE = 50 * 1024 * 1024

// Get R2 base URL from environment or use default
const getR2BaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client side - use environment variable if available
    return process.env.NEXT_PUBLIC_R2_BASE_URL || ''
  }
  return ''
}

class WhisperModelManager {
  // Specialized methods for model chunks
  private async putModelChunk(chunk: {
    key: string
    modelName: string
    chunkIndex: number
    data: Uint8Array
  }): Promise<void> {
    await db.put('chunks', chunk)
  }

  private async getModelChunks(modelName: string): Promise<
    Array<{
      key: string
      modelName: string
      chunkIndex: number
      data: Uint8Array
    }>
  > {
    // Since we removed getAllFromIndex from the common db, we'll implement it here
    const dbInstance = await db.getDB()
    const chunks = await dbInstance.getAllFromIndex('chunks', 'modelName', modelName)
    return chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
  }

  private async deleteModelChunks(modelName: string): Promise<void> {
    const chunks = await this.getModelChunks(modelName)
    for (const chunk of chunks) {
      await db.delete('chunks', chunk.key)
    }
  }

  async isModelDownloaded(modelKey: WhisperModelKey): Promise<boolean> {
    try {
      const model = await db.get('models', modelKey)
      return !!model
    } catch (error) {
      console.error('Error checking if model is downloaded:', error)
      return false
    }
  }

  async getDownloadedModels(): Promise<string[]> {
    try {
      const models = await db.getAll('models')
      return models.map(model => model.name)
    } catch (error) {
      console.error('Error getting downloaded models:', error)
      return []
    }
  }

  async downloadModel(
    modelKey: WhisperModelKey,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const modelInfo = WHISPER_MODELS[modelKey]
    if (!modelInfo) {
      throw new Error(`Unknown model: ${modelKey}`)
    }

    const r2base = getR2BaseUrl()
    if (!r2base) {
      throw new Error('Model download not configured.')
    }

    const url = `${r2base}/${modelInfo.url}`

    try {
      // Check if already downloaded
      if (await this.isModelDownloaded(modelKey)) {
        onProgress?.(100)
        return
      }

      // Download the model file
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download model: ${response.statusText}`)
      }

      const contentLength = parseInt(response.headers.get('Content-Length') || '0')
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error('Failed to read response body')
      }

      const chunks: Uint8Array[] = []
      let receivedLength = 0

      // Read response stream
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        chunks.push(value)
        receivedLength += value.length

        // Update progress
        if (contentLength > 0) {
          const progress = (receivedLength / contentLength) * 100
          onProgress?.(progress)
        }
      }

      // Combine all chunks into a single Uint8Array
      const fullData = new Uint8Array(receivedLength)
      let position = 0
      for (const chunk of chunks) {
        fullData.set(chunk, position)
        position += chunk.length
      }

      // Store in IndexedDB with chunking
      await this.storeModelInDB(modelKey, fullData)

      onProgress?.(100)
    } catch (error) {
      console.error('Error downloading model:', error)
      throw error
    }
  }

  private async storeModelInDB(modelKey: WhisperModelKey, data: Uint8Array): Promise<void> {
    // Calculate number of chunks needed
    const totalChunks = Math.ceil(data.length / CHUNK_SIZE)

    // Store model metadata
    await db.put('models', {
      name: modelKey,
      size: data.length,
      chunks: totalChunks,
      downloadedAt: Date.now(),
      version: '1.0',
    })

    // Store data chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, data.length)
      const chunkData = data.slice(start, end)

      await this.putModelChunk({
        key: `${modelKey}-${i}`,
        modelName: modelKey,
        chunkIndex: i,
        data: chunkData,
      })
    }
  }

  async getModel(modelKey: WhisperModelKey): Promise<Uint8Array | null> {
    try {
      // Get model metadata
      const model = await db.get('models', modelKey)
      if (!model) return null

      // Get all chunks for this model
      const chunks = await this.getModelChunks(modelKey)

      // Combine chunks into full data
      const fullData = new Uint8Array(model.size)
      let position = 0

      for (const chunk of chunks) {
        fullData.set(chunk.data, position)
        position += chunk.data.length
      }

      return fullData
    } catch (error) {
      console.error('Error getting model from DB:', error)
      return null
    }
  }

  async deleteModel(modelKey: WhisperModelKey): Promise<void> {
    try {
      // Delete model metadata
      await db.delete('models', modelKey)

      // Delete all chunks for this model
      await this.deleteModelChunks(modelKey)
    } catch (error) {
      console.error('Error deleting model from DB:', error)
      throw error
    }
  }

  async getStorageInfo(): Promise<{
    totalSize: number
    models: Array<{ name: string; size: number; downloadedAt: number }>
  }> {
    try {
      const models = await db.getAll('models')

      const totalSize = models.reduce((sum: number, model: any) => sum + model.size, 0)

      return {
        totalSize,
        models: models.map((model: any) => ({
          name: model.name,
          size: model.size,
          downloadedAt: model.downloadedAt,
        })),
      }
    } catch (error) {
      console.error('Error getting storage info:', error)
      return { totalSize: 0, models: [] }
    }
  }
}

// Export singleton instance
export const whisperModelManager = new WhisperModelManager()
