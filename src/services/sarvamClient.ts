import { SupportedLanguage, SarvamIntentResponse } from '../types/index.js';
import { api } from './api.js';

export const LANG_SPEECH_CODES: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  bn: 'bn-IN'
};

export interface VoiceRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function startVoiceRecognition(
  language: SupportedLanguage,
  handlers: VoiceRecognitionHandlers
): { stop: () => void } {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    handlers.onError?.('Web Speech API is not supported in this browser environment.');
    return { stop: () => {} };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = LANG_SPEECH_CODES[language] || 'en-IN';

  let finalTranscript = '';

  recognition.onstart = () => {
    handlers.onStart?.();
  };

  recognition.onresult = (event: any) => {
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    // Only call onResult with final transcript to prevent duplicate AI requests
    if (finalTranscript.trim()) {
      handlers.onResult?.(finalTranscript.trim());
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('[Sarvam Voice Client] Speech recognition error:', event.error);
    handlers.onError?.(event.error || 'Voice input error');
  };

  recognition.onend = () => {
    handlers.onEnd?.();
  };

  try {
    recognition.start();
  } catch (err: any) {
    handlers.onError?.(err.message || 'Could not start microphone');
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    }
  };
}

// ---- Text-to-Speech ----

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

function loadVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
    voicesLoaded = true;
  }
  return voicesLoaded ? cachedVoices : voices;
}

// Listen for voiceschanged event (fires when voices load asynchronously)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

export function stopSpeaking() {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {}
}

export function isSpeaking(): boolean {
  if (!('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
}

export function speakText(
  text: string,
  language: SupportedLanguage = 'en',
  handlers?: { onStart?: () => void; onEnd?: () => void; onError?: () => void }
) {
  if (!('speechSynthesis' in window)) {
    handlers?.onEnd?.();
    return;
  }

  try {
    // Cancel any active speech before starting new
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_SPEECH_CODES[language] || 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Try finding matching voice from cached or freshly loaded voices
    const voices = loadVoices();
    if (voices.length > 0) {
      const langCode = LANG_SPEECH_CODES[language] || 'en-IN';
      const matchingVoice =
        voices.find(v => v.lang === langCode) ||
        voices.find(v => v.lang.startsWith(language)) ||
        voices.find(v => v.lang.includes(langCode));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    utterance.onstart = () => {
      handlers?.onStart?.();
    };

    utterance.onend = () => {
      handlers?.onEnd?.();
    };

    utterance.onerror = () => {
      handlers?.onError?.();
      handlers?.onEnd?.();
    };

    // Small delay to ensure cancel() completes before speak()
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        handlers?.onEnd?.();
      }
    }, 50);
  } catch (e) {
    console.warn('[Sarvam Speech Synthesis] Failed to synthesize speech:', e);
    handlers?.onEnd?.();
  }
}

export async function processVoiceQuery(transcript: string, language: SupportedLanguage): Promise<SarvamIntentResponse> {
  const result = await api.sendSarvamIntent(transcript, language);
  if (result.responseText) {
    speakText(result.responseText, language);
  }
  return result;
}
