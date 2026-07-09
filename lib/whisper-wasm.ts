'use client'

import { DEFAULT_MODEL, estimateTranscriptionTime } from './whisper-models'

// Global module interface for the loaded WASM
declare global {
  interface Window {
    // biome-ignore lint/suspicious/noExplicitAny: WASM module interface
    Module: any
    webkitAudioContext?: typeof AudioContext
  }
}

// WASM module interface (based on emscripten.cpp bindings and official example)
interface WhisperModule {
  HEAPU8: Uint8Array
  _malloc: (size: number) => number
  _free: (ptr: number) => void
  onRuntimeInitialized?: () => void
  // biome-ignore lint/suspicious/noExplicitAny: WASM abort callback parameter
  onAbort?: (what: any) => void
  locateFile?: (path: string) => string

  // File system functions (from official whisper.cpp WASM example)
  FS_createDataFile: (
    parent: string,
    name: string,
    data: Uint8Array,
    canRead: boolean,
    canWrite: boolean
  ) => void
  FS_unlink: (path: string) => void

  // Whisper-specific functions from emscripten.cpp bindings
  init: (pathModel: string) => number // Returns context index (1-based) or 0 on failure
  free: (index: number) => void // Free context at index (1-based)
  full_default: (
    index: number, // Context index (1-based)
    // biome-ignore lint/suspicious/noExplicitAny: WASM audio constructor type
    audio: { length: number; constructor: any }, // Audio data
    lang: string, // Language code
    nthreads: number, // Number of threads
    translate: boolean // Whether to translate
  ) => number // Returns 0 on success, negative on error
}

export class WhisperWASM {
  private module: WhisperModule | null = null
  private instance: number | null = null
  private transcriptionResult = ''
  private modelFileName = ''
  private isTranscribing = false
  private isComplete = false
  private onProgress?: (result: string) => void

  async loadModule(): Promise<void> {
    if (this.module) return

    return new Promise((resolve, reject) => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        reject(new Error('WASM can only be loaded in browser environment'))
        return
      }

      // Check for SharedArrayBuffer support (required for threading)
      if (typeof SharedArrayBuffer === 'undefined') {
        console.warn('SharedArrayBuffer not available - WASM will run without threading')
      }

      // Set up Module configuration before loading
      window.Module = {
        // Memory configuration for better performance with larger models
        print: (text: string) => {
          // NOTE: enable this for debugging in dev
          // console.log('wasm output:', text)

          // Capture all transcription output and show it immediately
          if (this.isTranscribing) {
            // Look for timestamp lines to accumulate transcription
            if (text.includes('[') && text.includes(']') && text.includes('-->')) {
              this.transcriptionResult += `${text}\n`
              // Show result immediately as segments come in
              if (this.onProgress) {
                this.onProgress(this.transcriptionResult.trim())
              }
            }
          }
        },
        printErr: (text: string) => {
          // NOTE: enable this for debugging in dev
          // console.log('wasm log:', text)

          if (text.includes('whisper_print_timings:') && text.includes('total time =')) {
            this.isComplete = true
          }
        },
        setStatus: (text: string) => {
          console.log('wasm status:', text)
        },
        onRuntimeInitialized: () => {
          console.log('✅ WASM module loaded successfully')
          // biome-ignore lint/suspicious/noExplicitAny: accessing global WASM module
          this.module = (window as any).Module as WhisperModule
          resolve()
        },
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return '/wasm/whisper.wasm'
          }
          return `/wasm/${path}`
        },
      }

      // Load the WASM script
      const script = document.createElement('script')
      script.src = '/wasm/whisper.js'
      script.onload = () => {
        console.log('📦 WASM script loaded, waiting for runtime initialization...')
        // The onRuntimeInitialized callback will be called when ready
      }
      script.onerror = error => {
        reject(new Error(`Failed to load whisper.js: ${error}`))
      }
      document.head.appendChild(script)
    })
  }

  async initializeModel(modelData: Uint8Array): Promise<void> {
    await this.loadModule()
    const module = this.module!

    console.log(`📦 Initializing model from memory (${modelData.length} bytes)`)

    // Generate a unique filename for this model (like in index-tmpl.html)
    const modelPath = 'whisper.bin'
    this.modelFileName = modelPath

    try {
      // Remove existing file if it exists (like in index-tmpl.html storeFS function)
      try {
        module.FS_unlink(modelPath)
      } catch (_e) {
        // File doesn't exist, which is fine
      }

      // Create the model file in the virtual filesystem (exactly like index-tmpl.html)
      module.FS_createDataFile('/', modelPath, modelData, true, true)

      // Initialize whisper context from file (like the original whisper.wasm example)
      this.instance = module.init(modelPath)

      if (!this.instance || this.instance === 0) {
        throw new Error('Failed to initialize whisper context')
      }

      console.log(`✅ Model initialized successfully (context index: ${this.instance})`)
    } catch (error) {
      throw new Error(`Failed to initialize model: ${error}`)
    }
  }

  async transcribe(
    audioData: Float32Array,
    options: {
      language?: string
      translate?: boolean
      onProgress?: (result: string) => void
    } = {}
  ): Promise<string> {
    if (!this.module || !this.instance) {
      throw new Error('Model not initialized')
    }

    // Use conservative thread count based on device capabilities
    // navigator.hardwareConcurrency gives logical CPU cores, but be conservative
    const threads = Math.min(navigator.hardwareConcurrency || 4, 6)
    const { language = 'auto', translate = false, onProgress } = options
    this.onProgress = onProgress

    // Clear previous transcription result and set flags
    this.transcriptionResult = ''
    this.isTranscribing = true
    this.isComplete = false

    try {
      console.log(`🗣️ Starting transcription with ${audioData.length} samples`)

      // Use the same approach as the working test
      // Module.full_default is synchronous but takes time to complete
      const result = this.module.full_default(
        this.instance,
        audioData,
        language,
        threads,
        translate
      )

      console.log('js: full_default returned:', result)

      // Calculate actual audio duration from samples (whisper expects 16kHz)
      const audioDurationSeconds = audioData.length / 16000

      // Calculate max wait time based on estimated transcription time for this specific audio
      // Add 50% buffer to account for variability and ensure we don't timeout prematurely
      const maxEstimatedTime = estimateTranscriptionTime(DEFAULT_MODEL, audioDurationSeconds)
      const maxSeconds = Math.ceil(maxEstimatedTime * 1.5) // 50% buffer

      console.log(
        `⏱️ Audio: ${Math.round(audioDurationSeconds)}s, Max wait time: ${maxSeconds}s (estimated: ${Math.round(maxEstimatedTime)}s + 50% buffer)`
      )

      // Wait for the complete transcription (segments will come in via print callback)
      let attempts = 0
      const checkInterval = 250 // Check every 250ms for better responsiveness

      while (attempts < maxSeconds * 4 && this.isTranscribing && !this.isComplete) {
        await new Promise(resolve => setTimeout(resolve, checkInterval))
        attempts++

        // Check if we have accumulated transcription and completion marker
        if (
          this.transcriptionResult &&
          this.transcriptionResult.trim().length > 0 &&
          this.isComplete
        ) {
          console.log(`✅ Transcription completed: ${this.transcriptionResult.length} characters`)
          this.isTranscribing = false
          return this.transcriptionResult.trim()
        }
      }

      // Timeout or other completion
      this.isTranscribing = false

      // If we have some result but didn't see completion marker
      if (this.transcriptionResult && this.transcriptionResult.trim().length > 0) {
        console.log(
          `⚠️ Transcription completed without timing summary: ${this.transcriptionResult.length} characters`
        )
        return this.transcriptionResult.trim()
      }

      // If we didn't get a result, but the function returned successfully
      if (result === 0) {
        return 'Transcription completed successfully, but result capture failed. Check console for output.'
      }

      throw new Error(`Transcription failed with code: ${result}`)
    } catch (error) {
      this.isTranscribing = false
      this.isComplete = false
      throw new Error(`Transcription error: ${error}`)
    }
  }

  dispose(): void {
    if (this.module && this.instance) {
      try {
        this.module.free(this.instance)
        this.instance = null
        console.log('🗑️ Model instance disposed')
      } catch (error) {
        console.warn('Error disposing model instance:', error)
      }
    }

    // Clean up model file from virtual filesystem
    if (this.module && this.modelFileName) {
      try {
        this.module.FS_unlink(this.modelFileName)
        console.log(`🗑️ Cleaned up model file: ${this.modelFileName}`)
        this.modelFileName = ''
      } catch (error) {
        console.warn('Failed to clean up model file:', error)
      }
    }
  }
}

// Utility function to convert audio file to Float32Array
export async function audioFileToFloat32Array(file: File): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    const reader = new FileReader()
    reader.onload = async e => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Convert to mono and get Float32Array
        const channelData = audioBuffer.getChannelData(0)

        // Resample to 16kHz if necessary (whisper expects 16kHz)
        if (audioBuffer.sampleRate !== 16000) {
          const resampledData = resampleAudio(channelData, audioBuffer.sampleRate, 16000)
          resolve(resampledData)
        } else {
          resolve(channelData)
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read audio file'))
    reader.readAsArrayBuffer(file)
  })
}

// Simple linear resampling (for production, consider using a proper resampling library)
function resampleAudio(
  inputData: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return inputData
  }

  const ratio = inputSampleRate / outputSampleRate
  const outputLength = Math.floor(inputData.length / ratio)
  const outputData = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const inputIndex = i * ratio
    const index = Math.floor(inputIndex)
    const fraction = inputIndex - index

    if (index + 1 < inputData.length) {
      // Linear interpolation
      outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction
    } else {
      outputData[i] = inputData[index]
    }
  }

  return outputData
}
