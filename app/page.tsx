'use client'

import Footer from '@/components/footer'
import Header from '@/components/header'
import TranscriptionInterface from '@/components/transcription-interface'

export default function Home() {
  return (
    <div className='min-h-screen flex flex-col relative dot-grid overflow-hidden'>
      {/* Subtle zima glow */}
      <div
        className='absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-(--zima)/8 dark:bg-(--zima)/5 rounded-full blur-[120px] pointer-events-none'
        aria-hidden
      />

      {/* Content */}
      <div className='relative z-10 min-h-screen flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6'>
        <Header />

        <main className='flex-1 flex items-center justify-center py-8 md:py-12'>
          <TranscriptionInterface />
        </main>

        <Footer />
      </div>
    </div>
  )
}
