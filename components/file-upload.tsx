'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { File, Music, Upload, Video, X } from 'lucide-react'
import { useCallback, useState } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onRemoveFile: () => void
  isTranscribing?: boolean
}

const SUPPORTED_FORMATS = {
  audio: [
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/m4a',
    'audio/mp4',
    'audio/aac',
    'audio/aacp',
    'audio/ogg',
    'audio/opus',
    'audio/flac',
    'audio/x-flac',
    'audio/webm',
    'audio/3gpp',
    'audio/3gpp2',
    'audio/amr',
    'audio/x-aiff',
    'audio/aiff',
  ],
  video: [
    'video/mp4',
    'video/mov',
    'video/quicktime',
    'video/avi',
    'video/x-msvideo',
    'video/mkv',
    'video/x-matroska',
    'video/webm',
    'video/3gpp',
    'video/3gpp2',
    'video/x-flv',
    'video/x-ms-wmv',
    'video/x-ms-asf',
    'video/ogg',
    'video/ogv',
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

  const validateFile = (file: File): string | null => {
    if (!ALL_SUPPORTED_TYPES.includes(file.type)) {
      return 'Unsupported file format. Please select an audio or video file.'
    }

    if (file.size > 1024 * 1024 * 1024) {
      return 'File is too large. Please select a file smaller than 1GB.'
    }

    return null
  }

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
        <div className='flex items-center justify-between p-4 glass rounded-xl'>
          <div className='flex items-center gap-3'>
            <div className='text-primary'>{getFileIcon(selectedFile.type)}</div>
            <div className='flex flex-col'>
              <span className='font-medium text-sm'>{selectedFile.name}</span>
              <span className='text-xs text-muted-foreground'>
                {formatFileSize(selectedFile.size)} •{' '}
                {selectedFile.type.split('/')[1]?.toUpperCase()}
              </span>
            </div>
          </div>

          {!isTranscribing && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onRemoveFile}
              className='h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-lg transition-all duration-200'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>

        {error && (
          <div className='text-sm text-destructive p-3 bg-destructive/10 rounded-xl border border-destructive/20'>
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
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer',
          isDragOver
            ? 'border-primary/60 bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/40 hover:bg-accent/50',
          isTranscribing && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          id='file-input'
          type='file'
          accept={ALL_SUPPORTED_TYPES.join(',')}
          onChange={handleInputChange}
          className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
          disabled={isTranscribing}
        />

        <div className='space-y-4'>
          <div className='mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center'>
            <Upload className='h-6 w-6 text-primary' />
          </div>

          <div className='space-y-1.5'>
            <h3 className='text-base font-medium text-foreground'>Drop audio or video file here</h3>
            <p className='text-sm text-muted-foreground'>or click to browse your files</p>
          </div>

          <div className='text-xs text-muted-foreground/80 space-y-0.5'>
            <p>Audio: MP3, WAV, M4A, AAC, OGG, FLAC, WebM, OPUS, AIFF, AMR</p>
            <p>Video: MP4, MOV, AVI, MKV, WebM, 3GP, FLV, WMV, OGV</p>
            <p className='pt-1'>Max file size: 1GB • Max duration: 30 minutes</p>
          </div>
        </div>
      </div>

      {error && (
        <div className='text-sm text-destructive p-3 bg-destructive/10 rounded-xl border border-destructive/20'>
          {error}
        </div>
      )}
    </div>
  )
}
