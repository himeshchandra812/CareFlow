import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Volume2,
  Sparkles,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Stethoscope,
  Calendar,
  Clock,
  MapPin,
  FileText,
  HelpCircle,
  ShieldCheck,
  Check,
  Ban
} from 'lucide-react';
import { SupportedLanguage, SarvamIntentResponse } from '../types/index.js';
import { LANG_SPEECH_CODES, speakText } from '../services/sarvamClient.js';
import { api } from '../services/api.js';

interface VoiceAssistantModalProps {
  currentLang: SupportedLanguage;
  seniorMode?: boolean;
  onClose: () => void;
  onIntentExecute: (intentResult: SarvamIntentResponse, confirmAction?: boolean) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  currentLang,
  seniorMode = false,
  onClose,
  onIntentExecute
}) => {
  const [isListening, setIsListening] = useState(false);
  const [rawSpeechText, setRawSpeechText] = useState('');
  const [pendingPreviewText, setPendingPreviewText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sarvamResponse, setSarvamResponse] = useState<SarvamIntentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [context, setContext] = useState<Record<string, any>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleStartListening = async () => {
    // Release any active stream/recorder first to avoid conflicts
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setErrorMessage('');
    setSarvamResponse(null);
    setRawSpeechText('');
    setPendingPreviewText('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          if (audioBlob.size < 100) {
            throw new Error("No speech detected or recording was too short.");
          }
          const base64 = await blobToBase64(audioBlob);
          console.log(`[Voice Assistant] Sending base64 audio to server (${base64.length} characters)...`);
          
          const result = await api.sendSarvamVoice(base64, currentLang, context);
          console.log('[Voice Assistant] Response received:', result);
          
          setRawSpeechText(result.transcript);
          setPendingPreviewText(result.transcript);
          setSarvamResponse(result);
          
          if (result.extractedParams?.context) {
            setContext((prev) => ({ ...prev, ...result.extractedParams?.context }));
          }

          if (result.responseText) {
            try {
              speakText(result.responseText, currentLang);
            } catch {}
          }

          if (!result.extractedParams?.requiresConfirmation) {
            onIntentExecute(result, false);
          }
        } catch (err: any) {
          console.error('[Voice Assistant] Failed transcription/interpretation:', err);
          setErrorMessage("Could not understand the recording. Please speak clearly or write your request below.");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err: any) {
      console.warn('[Voice Assistant] Mic access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please enable mic permissions in your browser bar.');
      } else {
        setErrorMessage('Could not activate microphone. Please ensure your microphone is active and plugged in.');
      }
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    setIsListening(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const executeNLU = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsProcessing(true);
    setErrorMessage('');
    setPendingPreviewText('');
    setRawSpeechText('');

    try {
      const result = await api.sendSarvamIntent(queryText, currentLang, context);
      setSarvamResponse(result);
      setIsProcessing(false);

      if (result.extractedParams?.context) {
        setContext((prev) => ({ ...prev, ...result.extractedParams?.context }));
      }

      if (!result.extractedParams?.requiresConfirmation) {
        onIntentExecute(result, false);
      }
    } catch (e: any) {
      setIsProcessing(false);
      setErrorMessage(
        "I couldn't complete that request right now. Please try again."
      );
    }
  };

  // Actions for confirmed intents
  const handleConfirmAction = () => {
    if (sarvamResponse) {
      onIntentExecute(sarvamResponse, true);
      onClose();
    }
  };

  const handleChangeAction = () => {
    if (sarvamResponse) {
      onIntentExecute({ ...sarvamResponse, intent: 'find_doctor' }, false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
    >
      <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-800 space-y-5 relative overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 relative z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="voice-modal-title"
                className={`font-extrabold font-outfit text-white ${
                  seniorMode ? 'text-xl' : 'text-base sm:text-lg'
                }`}
              >
                CareFlow Voice Assistant
              </h3>
              <p className="text-[11px] text-teal-400 font-mono">
                Multilingual Voice Actions • {LANG_SPEECH_CODES[currentLang] || currentLang}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close voice assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="overflow-y-auto space-y-5 flex-1 pr-1">
          
          {/* Microphone Central Area */}
          <div className="flex flex-col items-center justify-center text-center space-y-3 relative z-10 pt-2">
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                seniorMode ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20 sm:w-24 sm:h-24'
              } ${
                isListening
                  ? 'voice-pulse bg-teal-600 text-white scale-105 ring-4 ring-teal-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-teal-400 border-2 border-teal-500/40'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              <Mic
                className={`${seniorMode ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-8 h-8 sm:w-10 sm:h-10'} ${
                  isListening ? 'animate-pulse text-white' : ''
                }`}
              />
            </button>

            {/* Current State Status */}
            <div
              className={`font-semibold ${
                seniorMode ? 'text-sm sm:text-base' : 'text-xs'
              } ${
                isListening
                  ? 'text-teal-400 animate-pulse'
                  : isProcessing
                  ? 'text-amber-300'
                  : 'text-slate-300'
              }`}
            >
              {isListening
                ? 'Listening...'
                : isProcessing
                ? 'Processing...'
                : 'Tap microphone or type request'}
            </div>
          </div>

          {/* Recognized Speech Text Preview */}
          {pendingPreviewText && (
            <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-3 relative z-10 animate-in fade-in duration-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Recognized Request:
              </div>
              <p
                className={`font-medium text-teal-200 italic ${
                  seniorMode ? 'text-base font-bold' : 'text-xs sm:text-sm'
                }`}
              >
                "{pendingPreviewText}"
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => executeNLU(pendingPreviewText)}
                  className="uiverse-btn-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex-1 cursor-pointer min-h-[44px]"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={handleStartListening}
                  className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer min-h-[44px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}

          {/* Sarvam AI Response / Confirmation Block */}
          {sarvamResponse && !pendingPreviewText && (
            <div className="p-4 bg-teal-950/90 rounded-2xl border border-teal-700/80 space-y-3 relative z-10 animate-in fade-in duration-200 text-left">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
                <Volume2 className="w-4 h-4" /> Voice Assistant Result
              </div>
              
              <p
                className={`text-teal-100 leading-relaxed ${
                  seniorMode ? 'text-base font-medium' : 'text-xs sm:text-sm'
                }`}
              >
                {sarvamResponse.responseText}
              </p>

              {/* Clarification Options for Multiple Appointments */}
              {sarvamResponse.extractedParams?.requiresClarification && sarvamResponse.extractedParams.options && (
                <div className="p-3 bg-slate-900/90 rounded-2xl border border-teal-500/50 space-y-2 mt-3 text-left">
                  <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    Select an appointment:
                  </div>
                  <div className="space-y-2">
                    {sarvamResponse.extractedParams.options.map((opt: any) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          const selectedAppt = {
                            _id: opt.id,
                            doctorName: opt.doctorName,
                            departmentName: opt.departmentName,
                            appointmentDate: opt.appointmentDate,
                            appointmentTime: opt.appointmentTime,
                            tokenNumber: opt.tokenNumber
                          };
                          onIntentExecute({
                            ...sarvamResponse,
                            extractedParams: {
                              ...sarvamResponse.extractedParams,
                              requiresClarification: false,
                              appointment: selectedAppt
                            }
                          }, true);
                          onClose();
                        }}
                        className="w-full p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-200 border border-slate-700 rounded-xl text-xs font-bold text-left transition-colors flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <div>{opt.doctorName} ({opt.departmentName})</div>
                          <div className="text-[10px] text-slate-400 font-medium">{opt.appointmentDate} • {opt.appointmentTime}</div>
                        </div>
                        <span className="text-[10px] font-bold bg-teal-900/80 px-2 py-0.5 rounded-md text-teal-300 border border-teal-700">
                          Token {opt.tokenNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Consequential Action Confirmation Options */}
              {sarvamResponse.extractedParams?.requiresConfirmation && (
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-teal-500/50 space-y-3 pt-3">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Please Confirm Action
                  </div>

                  {/* 1. Booking Action Confirmation */}
                  {sarvamResponse.intent === 'book_appointment' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmAction}
                        className="uiverse-btn-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex-1 cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleChangeAction}
                        className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer min-h-[44px]"
                      >
                        Change
                      </button>

                      <button
                        type="button"
                        onClick={() => setSarvamResponse(null)}
                        className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-medium cursor-pointer min-h-[44px]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* 2. Cancellation Action Confirmation */}
                  {sarvamResponse.intent === 'cancel_appointment' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmAction}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold flex-1 cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Cancel Appointment</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSarvamResponse(null)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold cursor-pointer min-h-[44px]"
                      >
                        Keep Appointment
                      </button>
                    </div>
                  )}

                  {/* 3. Reschedule Action Confirmation */}
                  {sarvamResponse.intent === 'reschedule_appointment' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmAction}
                        className="uiverse-btn-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex-1 cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Reschedule</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSarvamResponse(null)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-bold cursor-pointer min-h-[44px]"
                      >
                        Keep Current Slot
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Direct Open Action for non-consequential navigation */}
              {!sarvamResponse.extractedParams?.requiresConfirmation && (
                <div className="pt-2 border-t border-teal-800/60 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onIntentExecute(sarvamResponse, false);
                      onClose();
                    }}
                    className="uiverse-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                  >
                    <span>View Screen in App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/80 text-rose-200 text-xs sm:text-sm rounded-2xl border border-rose-800 relative z-10 flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

        </div>

        {/* Text Input Footer & Quick Manual Buttons */}
        <div className="space-y-3 shrink-0 relative z-10 border-t border-slate-800 pt-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textInput.trim()) {
                executeNLU(textInput);
                setTextInput('');
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type request (English, हिंदी, తెలుగు...)"
              className={`flex-1 px-3.5 py-2.5 bg-slate-800 text-white placeholder-slate-400 rounded-xl border border-slate-700 text-xs font-medium focus:outline-hidden focus:border-teal-500 ${
                seniorMode ? 'text-sm py-3' : ''
              }`}
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="uiverse-btn-primary p-2.5 rounded-xl cursor-pointer disabled:opacity-40 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Manual Voice Prompts */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => executeNLU('Find a cardiologist tomorrow morning')}
              className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-slate-300 border border-slate-700 cursor-pointer text-[11px]"
            >
              "Find a cardiologist"
            </button>
            <button
              type="button"
              onClick={() => executeNLU('Check my queue')}
              className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-slate-300 border border-slate-700 cursor-pointer text-[11px]"
            >
              "Check my queue"
            </button>
            <button
              type="button"
              onClick={() => executeNLU('Where is cardiology department?')}
              className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-slate-300 border border-slate-700 cursor-pointer text-[11px]"
            >
              "Where is my department?"
            </button>
            <button
              type="button"
              onClick={() => executeNLU('What should I bring?')}
              className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-slate-300 border border-slate-700 cursor-pointer text-[11px]"
            >
              "What should I bring?"
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
