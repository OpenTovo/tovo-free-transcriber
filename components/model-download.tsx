'use client'

import { useState, useEffect } from 'react'
import { whisperModelManager, WHISPER_MODELS, WhisperModelKey } from '@/lib/whisper-models'

interface ModelDownloadProps {
  onModelReady?: (modelKey: WhisperModelKey, modelData: Uint8Array) => void
}

export default function ModelDownload({ onModelReady }: ModelDownloadProps) {
  const [downloadedModels, setDownloadedModels] = useState<string[]>([])
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})
  const [downloading, setDownloading] = useState<Record<string, boolean>>({})
  const [storageInfo, setStorageInfo] = useState<{
    totalSize: number
    models: Array<{ name: string; size: number; downloadedAt: number }>
  }>({ totalSize: 0, models: [] })

  // Load downloaded models on component mount
  useEffect(() => {
    loadDownloadedModels()
    loadStorageInfo()
  }, [])

  const loadDownloadedModels = async () => {
    try {
      const models = await whisperModelManager.getDownloadedModels()
      setDownloadedModels(models)
    } catch (error) {
      console.error('Error loading downloaded models:', error)
    }
  }

  const loadStorageInfo = async () => {
    try {
      const info = await whisperModelManager.getStorageInfo()
      setStorageInfo(info)
    } catch (error) {
      console.error('Error loading storage info:', error)
    }
  }

  const downloadModel = async (modelKey: WhisperModelKey) => {
    try {
      setDownloading(prev => ({ ...prev, [modelKey]: true }))
      setDownloadProgress(prev => ({ ...prev, [modelKey]: 0 }))

      await whisperModelManager.downloadModel(modelKey, progress => {
        setDownloadProgress(prev => ({ ...prev, [modelKey]: progress }))
      })

      // Reload state after successful download
      await loadDownloadedModels()
      await loadStorageInfo()

      // Load the model data and notify parent component
      const modelData = await whisperModelManager.getModel(modelKey)
      if (modelData && onModelReady) {
        onModelReady(modelKey, modelData)
      }
    } catch (error) {
      console.error('Error downloading model:', error)
      alert(`Failed to download model: ${error}`)
    } finally {
      setDownloading(prev => ({ ...prev, [modelKey]: false }))
      setDownloadProgress(prev => ({ ...prev, [modelKey]: 0 }))
    }
  }

  const deleteModel = async (modelKey: WhisperModelKey) => {
    if (!confirm(`Are you sure you want to delete the ${WHISPER_MODELS[modelKey].name} model?`)) {
      return
    }

    try {
      await whisperModelManager.deleteModel(modelKey)
      await loadDownloadedModels()
      await loadStorageInfo()
    } catch (error) {
      console.error('Error deleting model:', error)
      alert(`Failed to delete model: ${error}`)
    }
  }

  const loadModel = async (modelKey: WhisperModelKey) => {
    try {
      const modelData = await whisperModelManager.getModel(modelKey)
      if (modelData && onModelReady) {
        onModelReady(modelKey, modelData)
      }
    } catch (error) {
      console.error('Error loading model:', error)
      alert(`Failed to load model: ${error}`)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className='space-y-6'>
      {/* Storage Info */}
      {storageInfo.totalSize > 0 && (
        <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
          <h3 className='text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2'>
            Storage Usage
          </h3>
          <p className='text-blue-700 dark:text-blue-200'>
            Total space used:{' '}
            <span className='font-mono'>{formatFileSize(storageInfo.totalSize)}</span>
          </p>
          <p className='text-blue-600 dark:text-blue-300 text-sm mt-1'>
            {storageInfo.models.length} model{storageInfo.models.length !== 1 ? 's' : ''} downloaded
          </p>
        </div>
      )}

      {/* Available Models */}
      <div className='space-y-4'>
        <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100'>Whisper Models</h2>

        <div className='grid gap-4'>
          {Object.entries(WHISPER_MODELS).map(([key, model]) => {
            const modelKey = key as WhisperModelKey
            const isDownloaded = downloadedModels.includes(modelKey)
            const isDownloading = downloading[modelKey]
            const progress = downloadProgress[modelKey] || 0

            return (
              <div
                key={key}
                className='border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                      {model.name}
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300 text-sm mt-1'>
                      {model.description}
                    </p>
                    <p className='text-gray-500 dark:text-gray-400 text-xs mt-1'>
                      Size: {formatFileSize(model.size)}
                    </p>

                    {isDownloaded && storageInfo.models.find(m => m.name === modelKey) && (
                      <p className='text-green-600 dark:text-green-400 text-xs mt-1'>
                        Downloaded:{' '}
                        {formatDate(
                          storageInfo.models.find(m => m.name === modelKey)!.downloadedAt
                        )}
                      </p>
                    )}
                  </div>

                  <div className='flex flex-col items-end space-y-2'>
                    {isDownloaded ? (
                      <>
                        <button
                          onClick={() => loadModel(modelKey)}
                          className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm'
                        >
                          Load Model
                        </button>
                        <button
                          onClick={() => deleteModel(modelKey)}
                          className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm'
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => downloadModel(modelKey)}
                        disabled={isDownloading}
                        className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm'
                      >
                        {isDownloading ? `Downloading... ${progress.toFixed(1)}%` : 'Download'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {isDownloading && (
                  <div className='mt-3'>
                    <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                      {progress.toFixed(1)}% - Downloading {model.name}...
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Cross-Origin Isolation Warning */}
      <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
        <h3 className='text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2'>
          ⚠️ Requirements
        </h3>
        <div className='text-yellow-800 dark:text-yellow-200 text-sm space-y-1'>
          <p>• Your browser must support SharedArrayBuffer (cross-origin isolation)</p>
          <p>• Models are downloaded and stored locally in your browser</p>
          <p>• No data is sent to external servers during transcription</p>
        </div>
      </div>
    </div>
  )
}
