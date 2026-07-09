export default function Footer() {
  return (
    <footer className='border-t border-white/20 dark:border-gray-800/80 bg-white/40 dark:bg-black/30 backdrop-blur-3xl supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 shadow-sm dark:shadow-lg backdrop-saturate-150'>
      <div className='mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8 text-sm'>
        <div className='flex items-center space-x-4 text-gray-600 dark:text-gray-300'>
          <span className='font-medium'>© 2025 Tovo</span>
          <span className='text-xs text-gray-400 dark:text-gray-500'>•</span>
          <a
            href='mailto:support@tovo.dev'
            className='text-xs hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer'
          >
            Contact
          </a>
          <span className='text-xs text-gray-400 dark:text-gray-500'>•</span>
          <a
            href='https://www.tovo.dev'
            className='text-xs hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer'
            target='_blank'
            rel='noopener noreferrer'
          >
            Tovo AI
          </a>
        </div>

        <div className='hidden md:flex items-center space-x-4 text-gray-500 dark:text-gray-400'>
          <span className='text-xs font-medium'>Multilingual</span>
          <span className='text-xs text-gray-400 dark:text-gray-500'>•</span>
          <span className='text-xs font-medium'>No sign-up required</span>
          <span className='text-xs text-gray-400 dark:text-gray-500'>•</span>
          <span className='text-xs font-medium'>100% Local Processing</span>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
