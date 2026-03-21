'use client'

import Header from '@/components/header'
import Footer from '@/components/footer'
import TranscriptionInterface from '@/components/transcription-interface'

export default function Home() {
  return (
    <div className='min-h-screen flex flex-col relative overflow-hidden'>
      {/* Lighter animated background gradient */}
      <div className='absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-black dark:to-gray-900'></div>
      <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-blue-200/20 to-transparent dark:via-blue-400/5'></div>

      {/* Subtle animated orbs */}
      <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/30 dark:bg-purple-500/5 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob'></div>
      <div className='absolute top-1/3 right-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/5 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000'></div>
      <div className='absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-500/5 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000'></div>

      {/* Content */}
      <div className='relative z-10 min-h-screen flex flex-col'>
        <Header />

        <main className='flex-1 flex items-center justify-center'>
          <TranscriptionInterface />
        </main>

        <Footer />
      </div>
    </div>
  )
}
