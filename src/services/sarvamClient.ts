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

  let recognition: any = null;
  
  try {
    recognition = new SpeechRecognition();
    recognition.continuous = false; // We want discrete chunks for intent processing
    recognition.interimResults = true;
    recognition.lang = LANG_SPEECH_CODES[language] || 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[Voice Client] Recognition started');
      handlers.onStart?.();
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const result = finalTranscript || interimTranscript;
      if (result) {
        handlers.onResult?.(result);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice Client] Recognition error:', event.error);
      // Handle specific errors for better UX
      let userMessage = 'Voice input error';
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          userMessage = 'Microphone access was denied. Please check your browser settings.';
          break;
        case 'network':
          userMessage = 'Network error during speech recognition.';
          break;
        case 'no-speech':
          userMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          userMessage = 'No microphone was found or it is already in use.';
          break;
        case 'aborted':
          userMessage = ''; // User manually stopped, no error needed
          break;
      }
      if (userMessage) handlers.onError?.(userMessage);
    };

    recognition.onend = () => {
      console.log('[Voice Client] Recognition ended');
      handlers.onEnd?.();
    };

    recognition.start();
  } catch (err: any) {
    console.error('[Voice Client] Failed to start recognition:', err);
    handlers.onError?.(err.message || 'Could not start microphone');
  }

  return {
    stop: () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          try {
            recognition.abort();
          } catch {}
        }
      }
    }
  };
}

export function speakText(text: string, language: SupportedLanguage = 'en') {
  if (!('speechSynthesis' in window)) return;

  try {
    // Stop any currently playing speech to make it interruptible
    window.speechSynthesis.cancel();
    
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_SPEECH_CODES[language] || 'en-IN';
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Wait for voices to be loaded (sometimes they aren't ready immediately)
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => 
        v.lang === LANG_SPEECH_CODES[language] || 
        v.lang.startsWith(language)
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
  } catch (e) {
    console.warn('[Speech Synthesis] Error:', e);
  }
}

export async function processVoiceQuery(transcript: string, language: SupportedLanguage): Promise<SarvamIntentResponse> {
  const result = await api.sendSarvamIntent(transcript, language);
  if (result.responseText) {
    speakText(result.responseText, language);
  }
  return result;
}
