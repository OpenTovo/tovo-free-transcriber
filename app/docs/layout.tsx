import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Free Audio & Video Transcription Guide - FAQ & Help | TOVO Transcriber',
  description:
    'Complete guide to free, private audio and video transcription. Learn how to transcribe lectures, meetings, interviews, and podcasts using AI-powered speech recognition.',
  keywords:
    'free transcription, audio to text, video transcription, speech recognition, voice to text, whisper AI, private transcription, meeting transcription, interview transcription, podcast transcription, lecture transcription, subtitle generation, captions, accessibility',
  openGraph: {
    title: 'Free Audio & Video Transcription Guide - FAQ & Help',
    description:
      'Complete guide to free, private audio and video transcription using AI. Perfect for students, journalists, researchers, and content creators.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
