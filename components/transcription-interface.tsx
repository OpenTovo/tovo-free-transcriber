'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/file-upload'
import { TranscriptionResults } from '@/components/transcription-results'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Languages } from 'lucide-react'
import { WhisperWASM, audioFileToFloat32Array } from '@/lib/whisper-wasm'
import {
  WhisperModelKey,
  whisperModelManager,
  DEFAULT_MODEL,
  getModelSizeMB,
  estimateTranscriptionTime,
  MAX_DURATION_SECONDS,
} from '@/lib/whisper-models'
import { toast } from 'sonner'
import { playSuccessSound, playErrorSound } from '@/lib/sound'

type TranscriptionState = 'idle' | 'loading-wasm' | 'loading-model' | 'transcribing' | 'done'

export default function TranscriptionInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [transcriptionResult, setTranscriptionResult] = useState<string>('')
  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>('idle')
  const [progress, setProgress] = useState(0)
  const [currentModel, setCurrentModel] = useState<WhisperModelKey | null>(null)
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const [estimatedTime, setEstimatedTime] = useState<number>(0)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [translateToEnglish, setTranslateToEnglish] = useState<boolean>(false)
  const whisperRef = useRef<WhisperWASM | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check if default model is already downloaded on mount
  useEffect(() => {
    const checkExistingModel = async () => {
      try {
        const isModelDownloaded = await whisperModelManager.isModelDownloaded(DEFAULT_MODEL)
        if (isModelDownloaded) {
          setCurrentModel(DEFAULT_MODEL)
          console.log(`✅ Model '${DEFAULT_MODEL}' found in IndexedDB`)
        }
      } catch (error) {
        console.error('Error checking for existing model:', error)
      }
    }

    checkExistingModel()

    // Cleanup interval on unmount
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  const getAudioDuration = async (file: File): Promise<number> => {
    return new Promise(resolve => {
      const audio = document.createElement('audio')
      audio.preload = 'metadata'

      audio.onloadedmetadata = () => {
        resolve(audio.duration)
        URL.revokeObjectURL(audio.src)
      }

      audio.onerror = () => {
        resolve(0) // Default to 0 if we can't get duration
        URL.revokeObjectURL(audio.src)
      }

      audio.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    // Get audio duration for validation and time estimation
    const duration = await getAudioDuration(file)

    if (duration > MAX_DURATION_SECONDS) {
      const minutes = Math.round(duration / 60)
      toast.error(`Audio is too long (${minutes} minutes). Maximum length is 30 minutes.`)
      return
    }

    setSelectedFile(file)
    setTranscriptionResult('')
    setProgress(0)
    setTranscriptionState('idle')
    setAudioDuration(duration)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setTranscriptionResult('')
    setProgress(0)
    setTranscriptionState('idle')
    setAudioDuration(0)
    setEstimatedTime(0)
    setRemainingTime(0)

    // Clean up countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }

  const getButtonText = () => {
    switch (transcriptionState) {
      case 'loading-wasm':
        return 'Loading WASM...'
      case 'loading-model':
        return `Downloading Model... ${Math.round(progress)}%`
      case 'transcribing':
        return remainingTime > 0 ? `Transcribing... (${remainingTime}s)` : 'Transcribing...'
      case 'done':
        return 'Done!'
      default:
        return 'Transcribe'
    }
  }

  const handleTranscribe = async () => {
    if (!selectedFile) return

    // Start timing
    startTimeRef.current = Date.now()

    try {
      setProgress(0)

      // Step 1: Load WASM module if needed
      if (!whisperRef.current) {
        setTranscriptionState('loading-wasm')
        console.log('🔄 Loading WASM module...')

        const whisper = new WhisperWASM()
        await whisper.loadModule()
        whisperRef.current = whisper
      }

      // Step 2: Download and initialize model if needed
      if (!currentModel) {
        setTranscriptionState('loading-model')
        console.log(`🔄 Downloading ${DEFAULT_MODEL} model...`)

        // Download the default model with progress
        await whisperModelManager.downloadModel(DEFAULT_MODEL, progress => {
          setProgress(progress)
        })

        // Load the model
        const modelData = await whisperModelManager.getModel(DEFAULT_MODEL)
        if (!modelData) {
          throw new Error('Failed to load model data after download')
        }

        // Initialize the model in WASM
        await whisperRef.current!.initializeModel(modelData)
        setCurrentModel(DEFAULT_MODEL)
      } else {
        // Model already exists, just load it into WASM if not already initialized
        setTranscriptionState('loading-model')
        console.log(`🔄 Loading existing ${currentModel} model...`)

        const modelData = await whisperModelManager.getModel(currentModel)
        if (!modelData) {
          throw new Error('Failed to load existing model data')
        }

        // Initialize the model in WASM
        await whisperRef.current!.initializeModel(modelData)
      }

      // Step 3: Transcribe
      setTranscriptionState('transcribing')

      // Calculate estimated time and start countdown
      const modelKey = currentModel || DEFAULT_MODEL
      const baseEstimated = estimateTranscriptionTime(modelKey, audioDuration)
      // Translation takes approximately double the time
      const estimated = translateToEnglish ? baseEstimated * 2 : baseEstimated
      setEstimatedTime(estimated)
      setRemainingTime(estimated)

      // Start countdown timer
      countdownIntervalRef.current = setInterval(() => {
        setRemainingTime(prev => Math.max(0, prev - 1))
      }, 1000)

      // Convert audio file to format needed by whisper
      console.log('🎵 Converting audio file...')

      const audioData = await audioFileToFloat32Array(selectedFile)

      // Run transcription
      console.log('🗣️ Starting transcription...')

      const result = await whisperRef.current!.transcribe(audioData, {
        language: 'auto',
        translate: translateToEnglish,
        onProgress: (partialResult: string) => {
          setTranscriptionResult(partialResult)
        },
      })

      setTranscriptionResult(result)
      setTranscriptionState('done')

      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      setRemainingTime(0)

      // Calculate time taken
      const timeElapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0
      const seconds = Math.round(timeElapsed / 1000)

      // Play success sound and show toast notification
      playSuccessSound()
      toast.success(`Transcription completed in ${seconds}s!`)

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setTranscriptionState('idle')
        setProgress(0)
      }, 2000)
    } catch (error) {
      console.error('Transcription error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      // Play error sound and show toast notification
      playErrorSound()
      toast.error(`Transcription failed: ${errorMessage}`)

      // Clear countdown interval on error
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      setRemainingTime(0)
      setTranscriptionState('idle')
      setProgress(0)
    }
  }

  const isTranscribing = transcriptionState !== 'idle' && transcriptionState !== 'done'

  return (
    <div className='w-full max-w-4xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6'>
      {/* Apple-style liquid glass card container */}
      <div className='bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-gray-700/60 shadow-xl dark:shadow-2xl p-4 md:p-6 space-y-4 md:space-y-6'>
        {/* Hero Section */}
        <div className='text-center space-y-2 md:space-y-3'>
          <h1 className='text-2xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent'>
            Free Transcription
          </h1>
          <p className='text-sm md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed px-2'>
            Transcribe audio and video files locally in the browser. Private, no sign-up, and always
            <span className='text-emerald-600 dark:text-emerald-400 font-semibold'> FREE</span>.
          </p>
        </div>

        {/* File Upload */}
        <FileUpload
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onRemoveFile={handleRemoveFile}
          isTranscribing={isTranscribing}
        />

        {/* Translation Options */}
        {selectedFile && (
          <div className='flex justify-center px-4'>
            <div className='flex items-center gap-3'>
              <label
                htmlFor='translate-select'
                className='text-sm font-medium text-gray-700 dark:text-gray-300'
              >
                Output:
              </label>
              <Select
                value={translateToEnglish ? 'translate' : 'transcribe'}
                onValueChange={value => setTranslateToEnglish(value === 'translate')}
                disabled={isTranscribing}
              >
                <SelectTrigger className='w-[180px] cursor-pointer'>
                  <SelectValue placeholder='Select output type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='transcribe' className='cursor-pointer'>
                    <span className='flex items-center gap-2'>
                      <FileText className='h-4 w-4' />
                      Transcribe only
                    </span>
                  </SelectItem>
                  <SelectItem value='translate' className='cursor-pointer'>
                    <span className='flex items-center gap-2'>
                      <Languages className='h-4 w-4' />
                      Translate to English
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Transcribe Button */}
        {selectedFile && (
          <div className='flex justify-center px-4'>
            {!currentModel ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleTranscribe}
                      disabled={isTranscribing}
                      size='lg'
                      className='w-full max-w-xs md:w-auto px-6 md:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold'
                    >
                      {getButtonText()}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side='top'
                    className='bg-black/80 backdrop-blur-md border border-white/20 text-sm text-gray-200 w-70'
                  >
                    First time? We'll download a ~{getModelSizeMB(DEFAULT_MODEL)}MB model to your
                    browser. It'll be cached locally for faster future transcriptions!
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                onClick={handleTranscribe}
                disabled={isTranscribing}
                size='lg'
                className='w-full max-w-xs md:w-auto px-6 md:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold'
              >
                {getButtonText()}
              </Button>
            )}
          </div>
        )}

        {/* Results */}
        <TranscriptionResults result={transcriptionResult} isTranscribing={isTranscribing} />
      </div>
    </div>
  )
}

export { TranscriptionInterface }
