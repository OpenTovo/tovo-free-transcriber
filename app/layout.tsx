import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { GoogleAnalytics } from '@next/third-parties/google'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'TOVO Free Transcriber - Convert Audio & Video to Text Online',
  description:
    'Free online audio and video transcription tool. Convert speech to text, transcribe podcasts, interviews, meetings, lectures, and voice recordings. No signup required, works offline in your browser.',
  keywords: [
    'audio to text',
    'video to text',
    'speech to text',
    'transcription',
    'free transcriber',
    'audio transcription',
    'video transcription',
    'voice to text',
    'convert audio to text',
    'convert video to text',
    'podcast transcription',
    'interview transcription',
    'meeting transcription',
    'lecture transcription',
    'voice recording transcription',
    'mp3 to text',
    'mp4 to text',
    'wav to text',
    'm4a to text',
    'webm to text',
    'automatic transcription',
    'AI transcription',
    'whisper transcription',
    'browser transcription',
    'offline transcription',
    'private transcription',
    'no signup transcription',
    'free speech recognition',
    'multilingual transcription',
  ],
  authors: [{ name: 'TOVO' }],
  creator: 'TOVO',
  publisher: 'TOVO',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'TOVO Free Transcriber - Convert Audio & Video to Text',
    description:
      'Free online transcription tool for audio and video files. Convert speech to text with AI-powered accuracy. No signup required, works offline.',
    url: 'https://transcribe.tovo.dev',
    siteName: 'TOVO Free Transcriber',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/tovo-logo-512.png',
        width: 512,
        height: 512,
        alt: 'TOVO Free Transcriber Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TOVO Free Transcriber - Convert Audio & Video to Text',
    description:
      'Free online transcription tool for audio and video files. Convert speech to text with AI-powered accuracy.',
    images: ['/tovo-logo-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TOVO Free Transcriber',
  applicationCategory: 'MultimediaApplication',
  description:
    'Free online audio and video transcription tool. Convert speech to text, transcribe podcasts, interviews, meetings, lectures, and voice recordings.',
  url: 'https://transcribe.tovo.dev',
  operatingSystem: 'Any',
  permissions: 'browser',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Audio to text transcription',
    'Video to text transcription',
    'Speech recognition',
    'MP3 to text conversion',
    'MP4 to text conversion',
    'WAV to text conversion',
    'M4A to text conversion',
    'WebM to text conversion',
    'Podcast transcription',
    'Interview transcription',
    'Meeting transcription',
    'Lecture transcription',
    'Voice memo transcription',
    'Multiple audio formats support',
    'Offline processing',
    'No registration required',
    'Privacy-focused',
    'Multi-language support',
    'AI-powered accuracy',
    'Browser-based transcription',
  ],
  browserRequirements: 'Requires JavaScript. Works with Chrome, Firefox, Safari, Edge.',
  creator: {
    '@type': 'Organization',
    name: 'TOVO',
  },
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'Audio Video Transcription Tool',
    applicationCategory: 'TranscriptionSoftware',
    operatingSystem: 'Web Browser',
    softwareVersion: '1.0',
    downloadUrl: 'https://transcribe.tovo.dev',
    screenshot: 'https://transcribe.tovo.dev/tovo-logo-512.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
      <GoogleAnalytics gaId='G-0WL7HRBMJ2' />
    </html>
  )
}
