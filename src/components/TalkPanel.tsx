import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceRepeater } from '../utils/voice';
import { playSound } from '../utils/audio';

interface TalkPanelProps {
  onVolumeChange: (vol: number) => void;
  setMood: (mood: 'happy' | 'sad' | 'dizzy' | 'sleeping' | 'eating' | 'sick' | 'talking') => void;
  isSleeping: boolean;
  onTalk?: () => void;
}

export const TalkPanel: React.FC<TalkPanelProps> = ({
  onVolumeChange,
  setMood,
  isSleeping,
  onTalk,
}) => {
  const [micState, setMicState] = useState<'idle' | 'listening' | 'processing' | 'repeating'>('idle');
  const [typedText, setTypedText] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const repeaterRef = useRef<VoiceRepeater | null>(null);

  useEffect(() => {
    repeaterRef.current = new VoiceRepeater();
    return () => {
      if (repeaterRef.current) {
        repeaterRef.current.stopPlayback();
      }
    };
  }, []);

  const handleStartMic = async () => {
    if (isSleeping) {
      playSound('hurt');
      setMicError('Clippy está durmiendo profundamente. ¡No lo despiertes!');
      setTimeout(() => setMicError(null), 3000);
      return;
    }

    if (!repeaterRef.current) return;
    playSound('tap');
    setMicError(null);
    setMicState('listening');

    const success = await repeaterRef.current.startRecording();
    if (!success) {
      setMicState('idle');
      setMicError(
        'No se pudo acceder al micrófono. Por favor, asegúrate de dar permisos o usa el teclado abajo.'
      );
    }
  };

  const handleStopMic = async () => {
    if (!repeaterRef.current || micState !== 'listening') return;
    playSound('tap');
    setMicState('processing');

    try {
      setMood('talking');
      setMicState('repeating');
      if (onTalk) onTalk();
      await repeaterRef.current.stopRecordingAndPlayback(
        1.55, // Pitch factor representing a cute chipmunk
        (volume) => {
          onVolumeChange(volume);
        },
        () => {
          // Finished playback
          setMood('happy');
          setMicState('idle');
          onVolumeChange(0);
        }
      );
    } catch (err) {
      console.warn("Could not record/decode mic logic:", err);
      setMicState('idle');
      setMood('happy');
      onVolumeChange(0);
    }
  };

  // Fallback: Web Speech Synthesis repetition
  const handleTextSpeech = () => {
    if (isSleeping) {
      playSound('hurt');
      setMicError('En silencio... Clippy está durmiendo.');
      setTimeout(() => setMicError(null), 3000);
      return;
    }

    if (!typedText.trim()) return;

    playSound('tap');
    setMicState('repeating');
    setMood('talking');
    if (onTalk) onTalk();

    const synth = window.speechSynthesis;
    if (!synth) {
      setMicState('idle');
      setMood('happy');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(typedText);
    
    // Pitch shift parameters
    utterance.pitch = 1.9; // super high-pitched cute clip voice!
    utterance.rate = 1.25; // funny fast talking

    // Attempt to locate a funny / native Spanish voice if possible, else default
    const voices = synth.getVoices();
    const spanishVoice = voices.find((v) => v.lang.startsWith('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    // Lipsync animation loop simulation
    let animateInterval = setInterval(() => {
      // oscillate random volume heights to match speaking
      onVolumeChange(0.35 + Math.random() * 0.65);
    }, 100);

    utterance.onend = () => {
      clearInterval(animateInterval);
      setMood('happy');
      setMicState('idle');
      onVolumeChange(0);
      setTypedText('');
    };

    utterance.onerror = () => {
      clearInterval(animateInterval);
      setMood('happy');
      setMicState('idle');
      onVolumeChange(0);
    };

    synth.speak(utterance);
  };

  return (
    <div id="talk-panel" className="w-full max-w-sm relative border border-slate-400 mt-2 p-3 bg-[#ece9d8] rounded-[3px] shadow-sm z-30">
      <span className="absolute -top-2.5 left-3 bg-[#ece9d8] px-1 text-[11px] font-sans font-bold text-slate-700">
        🔊 Repetidor Parlanchín (Voz)
      </span>

      <div className="flex flex-col gap-2 pt-1">
        {/* Interaction Center Visual */}
        <div className="xp-border-inset bg-white p-2.5 text-center flex flex-col items-center justify-center min-h-[85px] relative overflow-hidden">
          {micState === 'idle' && (
            <p className="text-[10px] text-slate-700 leading-snug font-sans">
              Haz clic en el micrófono de oficina para hablar con Clippy, ¡o escríbele un mensaje abajo para que lo repita de inmediato!
            </p>
          )}

          {micState === 'listening' && (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-red-600 font-bold text-[10px] animate-pulse font-sans tracking-wide">
                🎙️ CLIPPY ESTÁ ESCUCHANDO...
              </span>
              <p className="text-[9px] text-slate-500 font-sans max-w-[240px]">
                Di algo con tu micrófono y haz clic en "Terminar" para que él reaccione.
              </p>
              {/* Voice pulse indicator bar graph */}
              <div className="flex gap-1 h-3 items-center">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-red-500"
                    animate={{ height: [3, 13, 3] }}
                    transition={{ duration: 0.5 + i * 0.1, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          )}

          {micState === 'processing' && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl animate-spin">⚡</span>
              <p className="text-[9px] font-sans text-slate-600 font-bold uppercase">
                Procesando CLIPPY.SYS...
              </p>
            </div>
          )}

          {micState === 'repeating' && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#157900] font-bold text-[10px] animate-pulse font-sans tracking-wide">
                📣 REPRODUCIENDO BUFFER...
              </span>
              <div className="flex gap-1 h-3 items-center">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-[#157900]"
                    animate={{ height: [3, 15, 3] }}
                    transition={{ duration: 0.4 + i * 0.08, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Feedback/Error message bubble */}
          {micError && (
            <div className="absolute inset-0 bg-red-50 text-red-700 text-[10px] font-sans p-3 flex items-center justify-center border-l-4 border-red-500">
              ⚠️ {micError}
            </div>
          )}
        </div>

        {/* Primary Buttons and Keyboard Fallback Text Entry */}
        <div className="flex flex-col gap-2">
          {micState === 'idle' ? (
            <button
              onClick={handleStartMic}
              id="start-voice-mic"
              className="w-full xp-btn text-[11px] py-1 font-bold"
            >
              🎙️ Grabar Mi Voz
            </button>
          ) : micState === 'listening' ? (
            <button
              onClick={handleStopMic}
              id="stop-voice-mic"
              className="w-full xp-btn text-[11px] py-1 font-bold text-red-700"
            >
              ⏹️ Terminar y Escuchar
            </button>
          ) : (
            <button
              disabled
              className="w-full xp-btn text-[11px] py-1 opacity-50 cursor-not-allowed"
            >
              Clippy está ocupado...
            </button>
          )}

          {/* Fallback Text Input (Perfect for iframe/sandbox issues) */}
          <div className="flex gap-1.5 mt-1 border-t border-slate-300 pt-2">
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder="Escribe un diálogo rápido..."
              disabled={micState !== 'idle'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextSpeech();
              }}
              className="flex-1 xp-border-inset bg-white px-2 py-1 text-slate-800 font-sans text-[11px] focus:outline-hidden disabled:opacity-60"
            />
            <button
              onClick={handleTextSpeech}
              disabled={!typedText.trim() || micState !== 'idle'}
              className="xp-btn xp-btn-blue text-[11px] py-1 px-3 disabled:opacity-40"
            >
              Decir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
