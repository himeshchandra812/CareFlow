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
      const audioBuffer = Buffer.from(request.audioBase64, 'base64');
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'saaras:v4');
      
      const langCode = request.language === 'en' 
        ? 'en-IN' 
        : request.language === 'hi' 
          ? 'hi-IN' 
          : `${request.language}-IN`;
      formData.append('language_code', langCode);

      console.log(`[Sarvam STT] Forwarding audio file to Sarvam API (${audioBuffer.byteLength} bytes) for language ${langCode}...`);

      const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Sarvam STT] Transcription received successfully:', data.transcript);
        if (data.transcript) {
          return data.transcript;
        }
      } else {
        const errText = await response.text();
        console.warn('[Sarvam STT] API returned non-OK status:', response.status, errText);
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
