'use client'

import { FileText, Languages } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileUpload } from '@/components/file-upload'
import { TranscriptionResults } from '@/components/transcription-results'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { playErrorSound, playSuccessSound } from '@/lib/sound'
import {
  DEFAULT_MODEL,
  getModelSizeMB,
  MAX_DURATION_SECONDS,
  type WhisperModelKey,
  whisperModelManager,
} from '@/lib/whisper-models'
import { audioFileToFloat32Array, WhisperWASM } from '@/lib/whisper-wasm'

export type TranscriptionState = 'idle' | 'loading-wasm' | 'loading-model' | 'transcribing' | 'done'

export default function TranscriptionInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [transcriptionResult, setTranscriptionResult] = useState<string>('')
  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>('idle')
  const [progress, setProgress] = useState(0)
  const [currentModel, setCurrentModel] = useState<WhisperModelKey | null>(null)
  const [_audioDuration, setAudioDuration] = useState<number>(0)
  const [translateToEnglish, setTranslateToEnglish] = useState<boolean>(false)
  const whisperRef = useRef<WhisperWASM | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Check if default model is already downloaded on mount
  useEffect(() => {
    const checkExistingModel = async () => {
      try {
        const isModelDownloaded = await whisperModelManager.isModelDownloaded(DEFAULT_MODEL)
        if (isModelDownloaded) {
          setCurrentModel(DEFAULT_MODEL)
        }
      } catch (error) {
        console.error('Error checking for existing model:', error)
      }
    }

    checkExistingModel()
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
    // Get audio duration for validation
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
  }

  const getButtonText = () => {
    switch (transcriptionState) {
      case 'loading-wasm':
        return 'Loading engine…'
      case 'loading-model':
        return `Downloading model… ${Math.round(progress)}%`
      case 'transcribing':
        return 'Transcribing…'
      case 'done':
        return 'Done'
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

        const whisper = new WhisperWASM()
        await whisper.loadModule()
        whisperRef.current = whisper
      }

      // Step 2: Download and initialize model if needed
      if (!currentModel) {
        setTranscriptionState('loading-model')

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
        await whisperRef.current?.initializeModel(modelData)
        setCurrentModel(DEFAULT_MODEL)
      } else {
        // Model already exists, just load it into WASM if not already initialized
        setTranscriptionState('loading-model')

        const modelData = await whisperModelManager.getModel(currentModel)
        if (!modelData) {
          throw new Error('Failed to load existing model data')
        }

        // Initialize the model in WASM
        await whisperRef.current?.initializeModel(modelData)
      }

      // Step 3: Transcribe
      setTranscriptionState('transcribing')

      // Convert audio file to format needed by whisper
      const audioData = await audioFileToFloat32Array(selectedFile)

      // Run transcription
      const result = await whisperRef.current?.transcribe(audioData, {
        language: 'auto',
        translate: translateToEnglish,
        onProgress: (partialResult: string) => {
          setTranscriptionResult(partialResult)
        },
      })

      setTranscriptionResult(result)
      setTranscriptionState('done')

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

      setTranscriptionState('idle')
      setProgress(0)
    }
  }

  const isTranscribing = transcriptionState !== 'idle' && transcriptionState !== 'done'
  const buttonText = getButtonText()

  const transcribeButton = (
    <Button
      onClick={handleTranscribe}
      disabled={isTranscribing}
      size='lg'
      className='w-full max-w-xs md:w-auto px-8 font-semibold cursor-pointer'
    >
      {/* key remount replays the text-swap transition on label change */}
      <span key={buttonText} className='t-text-swap'>
        {buttonText}
      </span>
    </Button>
  )

  return (
    <div className='w-full max-w-6xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6'>
      <div className='bg-card border border-border shadow-card rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6'>
        {/* Hero Section */}
        <div className='text-center space-y-2 md:space-y-3'>
          <h1 className='text-2xl md:text-4xl font-semibold tracking-tight text-foreground'>
            Free Transcription
          </h1>
          <p className='text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2'>
            Transcribe audio and video files locally in the browser. Private, no sign-up, and always{' '}
            <span className='text-brand-soft-foreground font-semibold'>free</span>.
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
              <label htmlFor='translate-select' className='text-sm font-medium'>
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
          <div className='flex flex-col items-center gap-3 px-4'>
            {!currentModel ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>{transcribeButton}</TooltipTrigger>
                  <TooltipContent side='top' className='max-w-64 text-sm'>
                    First time? We'll download a ~{getModelSizeMB(DEFAULT_MODEL)}MB model to your
                    browser. It'll be cached locally for faster future transcriptions!
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              transcribeButton
            )}

            {/* Real progress bar while the model downloads */}
            {transcriptionState === 'loading-model' && progress > 0 && (
              <div className='w-full max-w-xs space-y-1.5'>
                <Progress value={progress} className='h-2' />
                <p className='text-muted-foreground text-center text-xs'>
                  One-time download — the model is stored on your device
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <TranscriptionResults result={transcriptionResult} state={transcriptionState} />
      </div>
    </div>
  )
}

export { TranscriptionInterface }
