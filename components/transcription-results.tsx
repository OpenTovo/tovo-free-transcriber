'use client'

import { Check, Copy, Download } from 'lucide-react'
import { useState } from 'react'
import type { TranscriptionState } from '@/components/transcription-interface'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

interface TranscriptionResultsProps {
  result: string
  state: TranscriptionState
}

const STATE_LABELS: Record<TranscriptionState, string | null> = {
  idle: null,
  'loading-wasm': 'Preparing engine…',
  'loading-model': 'Downloading model…',
  transcribing: 'Transcribing…',
  done: null,
}

export function TranscriptionResults({ result, state }: TranscriptionResultsProps) {
  const [copied, setCopied] = useState(false)
  const [showTimestamps, setShowTimestamps] = useState(true)

  const isWorking = state !== 'idle' && state !== 'done'
  const statusLabel = STATE_LABELS[state]

  // Keep the first viewport compact: results only appear once there's
  // something to show (streaming text, skeletons, or the final result).
  if (!result && !isWorking) {
    return null
  }

  const processText = (text: string, showTimestamps: boolean) => {
    if (showTimestamps) {
      // Remove milliseconds from timestamps
      return text.replace(
        /\[(\d{2}:\d{2}:\d{2})\.\d{3} --> (\d{2}:\d{2}:\d{2})\.\d{3}\]/g,
        '[$1 --> $2]'
      )
    }
    // Remove entire timestamp lines
    return text.replace(/\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]\n?/g, '')
  }

  const handleDownload = () => {
    const processedResult = processText(result, showTimestamps)
    const blob = new Blob([processedResult], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcription-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      const processedResult = processText(result, showTimestamps)
      await navigator.clipboard.writeText(processedResult)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <h3 className='text-lg font-medium tracking-tight'>
          {statusLabel ?? 'Transcription Result'}
        </h3>

        {result && !isWorking && (
          <div className='flex flex-wrap items-center justify-center sm:justify-end gap-2'>
            <div className='flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background cursor-pointer'>
              <Switch
                id='show-timestamps'
                checked={showTimestamps}
                onCheckedChange={setShowTimestamps}
                className='data-[state=checked]:bg-brand'
              />
              <Label htmlFor='show-timestamps' className='text-sm cursor-pointer'>
                Timestamps
              </Label>
            </div>

            <Button variant='outline' size='sm' onClick={handleCopy} className='h-9 cursor-pointer'>
              {copied ? <Check className='h-3 w-3' /> : <Copy className='h-3 w-3' />}
              {copied ? 'Copied' : 'Copy'}
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={handleDownload}
              className='h-9 cursor-pointer'
            >
              <Download className='h-3 w-3' />
              Download TXT
            </Button>
          </div>
        )}
      </div>

      <div className='border border-border rounded-xl bg-background'>
        <ScrollArea className='h-48 md:h-60 w-full p-4'>
          {result ? (
            // Partial text streams in live while transcribing
            <div className='whitespace-pre-wrap text-sm leading-relaxed font-mono text-foreground'>
              {processText(result, showTimestamps)}
              {state === 'transcribing' && <span className='animate-pulse text-brand'>▌</span>}
            </div>
          ) : (
            <div className='space-y-3'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
              <Skeleton className='h-4 w-4/6' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
