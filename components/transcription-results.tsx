'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Check, Copy, Download } from 'lucide-react'
import { useState } from 'react'

interface TranscriptionResultsProps {
  result: string
  isTranscribing: boolean
}

export function TranscriptionResults({ result, isTranscribing }: TranscriptionResultsProps) {
  const [copied, setCopied] = useState(false)
  const [showTimestamps, setShowTimestamps] = useState(true)

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

  if (!result && !isTranscribing) {
    return null
  }

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <h3 className='text-lg font-medium text-gray-800 dark:text-gray-200'>
          {isTranscribing ? 'Transcribing...' : 'Transcription Result'}
        </h3>

        {result && !isTranscribing && (
          <div className='flex flex-wrap items-center justify-center sm:justify-end gap-2'>
            <div className='flex items-center space-x-2 px-3 py-2 rounded-lg border border-white/30 dark:border-gray-700/50 bg-white/50 dark:bg-black/30 backdrop-blur-xl cursor-pointer'>
              <Switch
                id='show-timestamps'
                checked={showTimestamps}
                onCheckedChange={setShowTimestamps}
                className='data-[state=checked]:bg-blue-500'
              />
              <Label
                htmlFor='show-timestamps'
                className='text-sm text-gray-700 dark:text-gray-300 cursor-pointer'
              >
                Display Time
              </Label>
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={handleCopy}
              className='h-9 cursor-pointer border-white/30 dark:border-gray-700/50 bg-white/50 dark:bg-black/30 hover:bg-white/70 dark:hover:bg-black/50 text-gray-700 dark:text-gray-300 backdrop-blur-xl transition-all duration-300'
            >
              {copied ? <Check className='h-3 w-3 mr-1' /> : <Copy className='h-3 w-3 mr-1' />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={handleDownload}
              className='h-9 cursor-pointer border-white/30 dark:border-gray-700/50 bg-white/50 dark:bg-black/30 hover:bg-white/70 dark:hover:bg-black/50 text-gray-700 dark:text-gray-300 backdrop-blur-xl transition-all duration-300'
            >
              <Download className='h-3 w-3 mr-1' />
              Download TXT
            </Button>
          </div>
        )}
      </div>

      <div className='border border-white/30 dark:border-gray-800/50 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-2xl backdrop-saturate-150'>
        <ScrollArea className='h-48 md:h-60 w-full p-4'>
          {isTranscribing ? (
            <div className='space-y-3'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
              <Skeleton className='h-4 w-4/6' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-4 w-5/6' />
              <Skeleton className='h-4 w-2/3' />
            </div>
          ) : result ? (
            <div className='whitespace-pre-wrap text-sm leading-relaxed font-mono text-gray-800 dark:text-gray-200'>
              {processText(result, showTimestamps)}
            </div>
          ) : (
            <div className='flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400'>
              Your transcription will appear here
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
