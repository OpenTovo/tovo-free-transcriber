import Footer from '@/components/footer'
import Header from '@/components/header'
import TranscriptionInterface from '@/components/transcription-interface'
import { TryBanner } from '@/components/try-banner'

export default function Home() {
  return (
    <div className='min-h-screen flex flex-col relative overflow-hidden bg-background'>
      {/* Ambient accent glow (TovoType signature) */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='ambient-glow absolute left-1/2 top-[-240px] h-[560px] w-[70vw] -translate-x-1/2 rounded-full' />
      </div>

      {/* Content */}
      <div className='relative z-10 min-h-screen flex flex-col'>
        <TryBanner />
        <Header />

        <main className='flex-1 flex items-center justify-center'>
          <TranscriptionInterface />
        </main>

        <Footer />
      </div>
    </div>
  )
}
