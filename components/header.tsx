import Image from 'next/image'
import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'

export default function Header() {
  return (
    <header className='border-b border-border bg-background/72 backdrop-blur-xl'>
      <div className='mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8'>
        <div className='flex items-center gap-2.5'>
          <Link href='/' className='flex items-center gap-2.5'>
            <Image
              src='/tovo-icon.png'
              alt='Tovo Free Transcriber logo'
              width={28}
              height={28}
              className='rounded-md'
            />
            <span className='text-[15px] font-semibold tracking-tight'>Free Transcriber</span>
          </Link>
          <span className='hidden md:inline-block text-[11px] font-semibold uppercase tracking-wide text-brand-soft-foreground bg-brand-soft px-2.5 py-1 rounded-full'>
            Local & Private
          </span>
        </div>

        <div className='flex items-center gap-1'>
          <Link
            href='/docs'
            className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg px-3 py-2'
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
