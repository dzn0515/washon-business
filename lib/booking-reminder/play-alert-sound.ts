let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    audioContext = new Ctx()
  }
  return audioContext
}

export async function playBookingAlertSound(): Promise<void> {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    await ctx.resume().catch(() => {})
  }

  const now = ctx.currentTime
  const notes = [880, 1174.66, 880, 1318.51]

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now + index * 0.18)
    gain.gain.exponentialRampToValueAtTime(0.22, now + index * 0.18 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.16)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + index * 0.18)
    osc.stop(now + index * 0.18 + 0.18)
  })
}
