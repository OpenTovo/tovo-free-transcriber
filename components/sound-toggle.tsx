'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isSoundEnabled, setSoundEnabled } from '@/lib/sound'

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setEnabled(isSoundEnabled())
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className='h-7 w-7' />
  }

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    setSoundEnabled(next)
  }

  return (
    <button
      type='button'
      onClick={toggle}
      title={enabled ? 'Mute notification sounds' : 'Unmute notification sounds'}
      aria-label={enabled ? 'Mute sounds' : 'Unmute sounds'}
      className='p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-[0.98]'
    >
      {enabled ? <Volume2 className='h-4 w-4' /> : <VolumeX className='h-4 w-4' />}
    </button>
  )
}
