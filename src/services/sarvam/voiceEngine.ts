import { SupportedLanguage } from '../../types/index.js';

export interface SarvamVoiceRequest {
  audioBase64?: string;
  transcript?: string;
  language: SupportedLanguage;
}

export interface SarvamVoiceResponse {
  transcript: string;
  language: SupportedLanguage;
  audioUrl?: string;
}

export async function processSarvamSTT(request: SarvamVoiceRequest): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;

  if (request.transcript) {
    return request.transcript;
  }

  if (apiKey && request.audioBase64) {
    try {
      const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          audio: request.audioBase64,
          language_code: request.language || 'en-IN'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.transcript) {
          return data.transcript;
        }
      }
    } catch (e) {
      console.warn('[Sarvam Voice Engine] STT API call error:', e);
    }
  }

  return request.transcript || '';
}

export async function processSarvamTTS(text: string, language: SupportedLanguage): Promise<{ audioSupported: boolean }> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (apiKey) {
    try {
      // Future Sarvam TTS API integration
      return { audioSupported: true };
    } catch {}
  }
  return { audioSupported: true };
}
