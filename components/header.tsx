import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'

export default function Header() {
  return (
    <header className='border-b border-white/20 dark:border-gray-800/80 bg-white/40 dark:bg-black/30 backdrop-blur-3xl supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 shadow-sm dark:shadow-lg backdrop-saturate-150'>
      <div className='mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center space-x-3'>
          <Link
            href='/'
            className='text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent hover:opacity-80 transition-opacity'
          >
            Free Transcriber
          </Link>
          <span className='hidden md:inline-block text-xs font-medium text-emerald-600 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 backdrop-blur-sm'>
            Local & Private
          </span>
        </div>

        <div className='flex items-center space-x-4'>
          <Link
            href='/docs'
            className='text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors'
          >
            Help & FAQ
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export { Header }
