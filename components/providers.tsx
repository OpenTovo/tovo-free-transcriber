'use client'

import { Provider } from 'jotai'
import { ThemeProvider as NextThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'

interface ProvidersProps {
  children: React.ReactNode
  themeProps?: React.ComponentProps<typeof NextThemeProvider>
}

function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute='class' enableSystem disableTransitionOnChange storageKey='theme'>
      {children}
      <Toaster richColors />
    </NextThemeProvider>
  )
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <Provider>
      <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
    </Provider>
  )
}
