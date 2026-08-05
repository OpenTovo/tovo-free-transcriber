'use client'

import { File, Music, Upload, Video, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onRemoveFile: () => void
  isTranscribing?: boolean
}

const SUPPORTED_FORMATS = {
  audio: [
    'audio/mp3',
    'audio/mpeg', // MP3 alternative MIME type
    'audio/wav',
    'audio/wave', // WAV alternative MIME type
    'audio/x-wav', // WAV alternative MIME type
    'audio/m4a',
    'audio/mp4', // M4A alternative MIME type
    'audio/aac',
    'audio/aacp', // AAC alternative MIME type
    'audio/ogg',
    'audio/opus', // Opus codec in OGG
    'audio/flac',
    'audio/x-flac', // FLAC alternative MIME type
    'audio/webm', // WebM audio
    'audio/3gpp', // 3GP audio
    'audio/3gpp2', // 3GP2 audio
    'audio/amr', // AMR audio
    'audio/x-aiff', // AIFF
    'audio/aiff', // AIFF alternative
  ],
  video: [
    'video/mp4',
    'video/mov',
    'video/quicktime', // MOV alternative MIME type
    'video/avi',
    'video/x-msvideo', // AVI alternative MIME type
    'video/mkv',
    'video/x-matroska', // MKV alternative MIME type
    'video/webm',
    'video/3gpp', // 3GP
    'video/3gpp2', // 3GP2
    'video/x-flv', // FLV
    'video/x-ms-wmv', // WMV
    'video/x-ms-asf', // ASF
    'video/ogg', // OGV
    'video/ogv', // OGV alternative
  ],
}

const ALL_SUPPORTED_TYPES = [...SUPPORTED_FORMATS.audio, ...SUPPORTED_FORMATS.video]

export function FileUpload({
  onFileSelect,
  selectedFile,
  onRemoveFile,
  isTranscribing,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ALL_SUPPORTED_TYPES.includes(file.type)) {
      return 'Unsupported file format. Please select an audio or video file.'
    }

    // 1GB limit - reasonable for modern devices while staying within browser memory limits
    // Actual constraint is the 30-minute duration limit, not file size
    if (file.size > 1024 * 1024 * 1024) {
      return 'File is too large. Please select a file smaller than 1GB.'
    }

    return null
  }, [])

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null)
      const validationError = validateFile(file)

      if (validationError) {
        setError(validationError)
        return
      }

      onFileSelect(file)
    },
    [onFileSelect, validateFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return <Video className='h-5 w-5' />
    if (type.startsWith('audio/')) return <Music className='h-5 w-5' />
    return <File className='h-5 w-5' />
  }

  if (selectedFile) {
    return (
      <div className='w-full space-y-4'>
        <div className='flex items-center justify-between p-4 bg-background rounded-xl border border-border'>
          <div className='flex items-center gap-3 min-w-0'>
            <div className='text-brand shrink-0'>{getFileIcon(selectedFile.type)}</div>
            <div className='flex flex-col min-w-0'>
              <span className='font-medium text-sm truncate'>{selectedFile.name}</span>
              <span className='text-xs text-muted-foreground'>
                {formatFileSize(selectedFile.size)} ·{' '}
                {selectedFile.type.split('/')[1]?.toUpperCase()}
              </span>
            </div>
          </div>

          {!isTranscribing && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onRemoveFile}
              className='h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive cursor-pointer shrink-0'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>

        {error && (
          <div className='text-sm text-destructive p-3 bg-destructive/5 rounded-xl border border-destructive/30'>
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='w-full space-y-4'>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer bg-background',
          isDragOver
            ? 'border-brand/60 bg-brand-soft scale-[1.01]'
            : 'border-border hover:border-brand/40 hover:bg-brand-soft/40',
          isTranscribing && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          id='file-input'
          type='file'
          accept={ALL_SUPPORTED_TYPES.join(',')}
          onChange={handleInputChange}
          className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
          disabled={isTranscribing}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        />

        <div className='space-y-4'>
          <div className='mx-auto w-12 h-12 bg-brand-soft rounded-xl flex items-center justify-center'>
            <Upload className='h-6 w-6 text-brand-soft-foreground' />
          </div>

          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Drop audio or video file here</h3>
            <p className='text-sm text-muted-foreground'>or click to browse your files</p>
          </div>

          <div className='text-xs text-muted-foreground'>
            <p>Audio: MP3, WAV, M4A, AAC, OGG, FLAC, WebM, OPUS, AIFF, AMR</p>
            <p>Video: MP4, MOV, AVI, MKV, WebM, 3GP, FLV, WMV, OGV</p>
            <p className='mt-1'>Max file size: 1GB · Max duration: 30 minutes</p>
          </div>
        </div>
      </div>

      {error && (
        <div className='text-sm text-destructive p-3 bg-destructive/5 rounded-xl border border-destructive/30'>
          {error}
        </div>
      )}
    </div>
  )
}
