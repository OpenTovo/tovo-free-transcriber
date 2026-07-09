import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// Theme atom using jotai storage (replaces localStorage)
export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light')

// Resolved theme atom (computed based on system preference)
export const resolvedThemeAtom = atom(get => {
  const theme = get(themeAtom)
  return theme
})

// Actions for theme management
export const setThemeAtom = atom(null, (_get, set, newTheme: 'light' | 'dark') => {
  set(themeAtom, newTheme)
})

// Toggle theme atom
export const toggleThemeAtom = atom(null, (get, set) => {
  const current = get(themeAtom)
  // Toggle between light and dark
  set(themeAtom, current === 'dark' ? 'light' : 'dark')
})

// UI preferences atom
export const uiPreferencesAtom = atomWithStorage('ui-preferences', {
  sidebarCollapsed: false,
  showWelcomeMessage: true,
  compactMode: false,
})

// Transcription settings atom
export const transcriptionSettingsAtom = atomWithStorage('transcription-settings', {
  autoDownloadModels: false,
  preferredModel: 'base' as const,
  audioQuality: 'high' as 'low' | 'medium' | 'high',
  showTimestamps: false,
})

// App state atom (non-persistent)
export const appStateAtom = atom({
  isLoading: false,
  currentModel: null as string | null,
  transcriptionInProgress: false,
})
