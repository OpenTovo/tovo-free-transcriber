export default function Footer() {
  return (
    <footer className='mt-auto'>
      <div className='gradient-line mb-4' />
      <div className='flex flex-col sm:flex-row items-center justify-between gap-3 py-4 text-sm'>
        <div className='flex items-center gap-3 text-muted-foreground'>
          <span className='font-medium'>© {new Date().getFullYear()} Tovo</span>
          <span className='text-border'>•</span>
          <a
            href='mailto:support@tovo.dev'
            className='text-xs hover:text-zima transition-colors cursor-pointer'
          >
            Contact
          </a>
          <span className='text-border'>•</span>
          <a
            href='https://www.tovo.dev'
            className='text-xs hover:text-zima transition-colors cursor-pointer'
            target='_blank'
            rel='noopener noreferrer'
          >
            Tovo AI
          </a>
        </div>

        <div className='hidden md:flex items-center gap-3 text-muted-foreground/80'>
          <span className='text-xs font-medium'>Multilingual</span>
          <span className='text-border'>•</span>
          <span className='text-xs font-medium'>No sign-up</span>
          <span className='text-border'>•</span>
          <span className='text-xs font-medium'>100% Local</span>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
