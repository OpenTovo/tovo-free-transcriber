'use client'

import { themeAtom } from '@/lib/atoms'
import { useAtom } from 'jotai'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [_currentTheme, setTheme] = useAtom(themeAtom)
  const { setTheme: setNextTheme, theme: nextTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before showing (prevents hydration issues)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only sync when user actually changes the theme, not on mount
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    setNextTheme(newTheme)
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className='flex items-center space-x-1 bg-white/30 dark:bg-black/20 backdrop-blur-xl rounded-xl p-1 border border-white/40 dark:border-gray-800/60 shadow-md backdrop-saturate-150'>
        <div className='p-2 rounded-lg w-8 h-8' />
        <div className='p-2 rounded-lg w-8 h-8' />
      </div>
    )
  }

  return (
    <div className='flex items-center space-x-1 bg-white/30 dark:bg-black/20 backdrop-blur-xl rounded-xl p-1 border border-white/40 dark:border-gray-800/60 shadow-md backdrop-saturate-150'>
      <button
        type='button'
        onClick={() => handleThemeChange('light')}
        className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
          nextTheme === 'light'
            ? 'bg-white/80 dark:bg-gray-700/80 shadow-sm border border-white/50 dark:border-gray-600/50 text-gray-800 dark:text-white backdrop-blur-sm'
            : 'hover:bg-white/20 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
        }`}
        title='Light mode'
      >
        <Sun className='h-4 w-4' />
      </button>

      <button
        type='button'
        onClick={() => handleThemeChange('dark')}
        className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
          nextTheme === 'dark'
            ? 'bg-white/80 dark:bg-gray-700/80 shadow-sm border border-white/50 dark:border-gray-600/50 text-gray-800 dark:text-white backdrop-blur-sm'
            : 'hover:bg-white/20 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
        }`}
        title='Dark mode'
      >
        <Moon className='h-4 w-4' />
      </button>
    </div>
  )
}
