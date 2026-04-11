// ── Browser compatibility checks ──

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  )
}

// ── Text-to-Speech ──

/**
 * Speak the given text using the Web Speech API.
 *
 * @param text - The text to pronounce.
 * @param lang - BCP 47 language tag (default: 'zh-CN').
 */
export function speak(text: string, lang = 'zh-CN'): void {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis is not supported in this browser.')
    return
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.85 // slightly slower for language learning

  // Try to pick a Chinese voice if available
  const voices = window.speechSynthesis.getVoices()
  const chineseVoice = voices.find((v) => v.lang.startsWith('zh'))
  if (chineseVoice) {
    utterance.voice = chineseVoice
  }

  window.speechSynthesis.speak(utterance)
}

// ── Speech Recognition ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognitionInstance: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognitionConstructor(): any {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any
  return win.SpeechRecognition || win.webkitSpeechRecognition || null
}

/**
 * Start listening for speech and return the recognized text.
 *
 * @param lang - BCP 47 language tag (default: 'zh-CN').
 * @returns A promise that resolves with the recognized text.
 */
export function startListening(lang = 'zh-CN'): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor()

    if (!SpeechRecognitionCtor) {
      reject(new Error('Speech recognition is not supported in this browser.'))
      return
    }

    // Stop any existing recognition session
    if (recognitionInstance) {
      recognitionInstance.abort()
    }

    const recognition = new SpeechRecognitionCtor()
    recognitionInstance = recognition

    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      recognitionInstance = null
      resolve(transcript)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      recognitionInstance = null
      reject(new Error(`Speech recognition error: ${event?.error}`))
    }

    recognition.onend = () => {
      // If we reach onend without a result, resolve with empty string
      if (recognitionInstance === recognition) {
        recognitionInstance = null
        resolve('')
      }
    }

    recognition.start()
  })
}

/**
 * Stop the current speech recognition session.
 */
export function stopListening(): void {
  if (recognitionInstance) {
    recognitionInstance.stop()
    recognitionInstance = null
  }
}
