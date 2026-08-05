import { SoundToggle } from './sound-toggle'

export default function Footer() {
  return (
    <footer className='border-t border-border'>
      <div className='mx-auto flex h-14 w-full max-w-6xl items-center justify-center md:justify-between px-4 sm:px-8 text-sm'>
        <div className='flex items-center gap-4 text-muted-foreground'>
          <a
            href='mailto:support@tovo.dev'
            className='text-xs hover:text-brand-strong transition-colors cursor-pointer'
          >
            Contact
          </a>
          <span className='text-xs text-muted-foreground/50'>·</span>
          <a
            href='https://www.tovo.dev'
            className='text-xs hover:text-brand-strong transition-colors cursor-pointer'
            target='_blank'
            rel='noopener noreferrer'
          >
            Tovo AI
          </a>
          <span className='text-xs text-muted-foreground/50'>·</span>
          <SoundToggle />
        </div>

        <div className='hidden md:flex items-center gap-4 text-muted-foreground'>
          <span className='text-xs'>Multilingual</span>
          <span className='text-xs text-muted-foreground/50'>·</span>
          <span className='text-xs'>No sign-up required</span>
          <span className='text-xs text-muted-foreground/50'>·</span>
          <span className='text-xs'>100% Local Processing</span>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
