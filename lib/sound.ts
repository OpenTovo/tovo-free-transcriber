/**
 * Utility for playing notification sounds using Web Audio API
 */

let audioContext: AudioContext | null = null

/**
 * Get or create AudioContext (lazy initialization)
 */
function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Resume AudioContext if it's suspended (required by browser autoplay policies)
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }

    return audioContext
  } catch (error) {
    console.warn('Web Audio API not supported:', error)
    return null
  }
}

/**
 * Play a pleasant success notification sound
 * Creates a gentle two-tone chime using oscillators
 */
export function playSuccessSound(): void {
  const context = getAudioContext()
  if (!context) return

  try {
    // Create a pleasant two-tone chime
    const now = context.currentTime

    // First tone (higher pitch)
    const osc1 = context.createOscillator()
    const gain1 = context.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(800, now) // C5 note

    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.1, now + 0.05)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    osc1.connect(gain1)
    gain1.connect(context.destination)

    osc1.start(now)
    osc1.stop(now + 0.3)

    // Second tone (lower pitch, slight delay)
    const osc2 = context.createOscillator()
    const gain2 = context.createGain()

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(600, now + 0.15) // G4 note

    gain2.gain.setValueAtTime(0, now + 0.15)
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.2)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

    osc2.connect(gain2)
    gain2.connect(context.destination)

    osc2.start(now + 0.15)
    osc2.stop(now + 0.5)
  } catch (error) {
    console.warn('Failed to play notification sound:', error)
  }
}

/**
 * Play an error notification sound
 * Creates a lower, more subdued tone
 */
export function playErrorSound(): void {
  const context = getAudioContext()
  if (!context) return

  try {
    const now = context.currentTime

    // Single lower tone for errors
    const osc = context.createOscillator()
    const gain = context.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, now) // Lower frequency for error

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

    osc.connect(gain)
    gain.connect(context.destination)

    osc.start(now)
    osc.stop(now + 0.4)
  } catch (error) {
    console.warn('Failed to play error sound:', error)
  }
}
