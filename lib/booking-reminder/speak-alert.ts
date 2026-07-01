export function speakBookingAlert(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  utterance.rate = 0.95
  utterance.pitch = 1

  const voices = window.speechSynthesis.getVoices()
  const koVoice = voices.find((v) => v.lang.startsWith('ko'))
  if (koVoice) utterance.voice = koVoice

  window.speechSynthesis.speak(utterance)
}

export function primeSpeechVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}
