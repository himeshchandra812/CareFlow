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

  recognition.onstart = () => {
    handlers.onStart?.();
  };

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    const currentTranscript = final || interim;
    if (currentTranscript) {
      handlers.onResult?.(currentTranscript);
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

export function speakText(text: string, language: SupportedLanguage = 'en') {
  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any active speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_SPEECH_CODES[language] || 'en-IN';
    utterance.rate = 0.95; // Slightly calmer speaking rate for healthcare clarity
    utterance.pitch = 1.0;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(language) || v.lang.includes(LANG_SPEECH_CODES[language]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('[Sarvam Speech Synthesis] Failed to synthesize speech:', e);
  }
}

export async function processVoiceQuery(transcript: string, language: SupportedLanguage): Promise<SarvamIntentResponse> {
  const result = await api.sendSarvamIntent(transcript, language);
  if (result.responseText) {
    speakText(result.responseText, language);
  }
  return result;
}
