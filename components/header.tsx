import { AudioLines } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'

export default function Header() {
  return (
    <header className='sticky top-0 z-50 glass border-b border-border/50'>
      <div className='flex h-16 items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Link href='/' className='flex items-center gap-2.5 group'>
            <div className='flex items-center justify-center w-9 h-9 rounded-xl bg-(--zima)/10 border border-(--zima)/20 group-hover:bg-(--zima)/15 transition-colors'>
              <AudioLines className='h-5 w-5 text-zima' />
            </div>
            <span className='text-lg font-bold tracking-tight'>
              Free <span className='text-zima'>Transcriber</span>
            </span>
          </Link>
          <span className='hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20'>
            <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
            Local & Private
          </span>
        </div>

        <div className='flex items-center gap-4'>
          <Link
            href='/docs'
            className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
          >
            Help & FAQ
          </Link>
          <ThemeToggle />
        </div>
      </div>
      <div className='gradient-line' />
    </header>
  )
}

export { Header }
