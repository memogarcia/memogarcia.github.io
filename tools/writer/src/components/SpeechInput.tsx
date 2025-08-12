import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { cn } from '../utils/cn';

interface SpeechInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function SpeechInput({ onTranscript, className }: SpeechInputProps) {
  const [showRecording, setShowRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onError: (error) => {
      if ((window as any).showToast) {
        (window as any).showToast({
          title: 'Speech Recognition Error',
          description: error,
          variant: 'error',
        });
      }
      setShowRecording(false);
    },
  });

  // Setup audio visualization
  useEffect(() => {
    if (isListening && !audioContextRef.current) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          streamRef.current = stream;
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          
          analyser.fftSize = 256;
          source.connect(analyser);
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          const updateLevel = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
              setAudioLevel(average / 255);
              animationRef.current = requestAnimationFrame(updateLevel);
            }
          };
          
          updateLevel();
        })
        .catch(error => {
          console.error('Error accessing microphone:', error);
        });
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      }
    };
  }, [isListening]);

  const handleStartRecording = () => {
    if (!isSupported) {
      if ((window as any).showToast) {
        (window as any).showToast({
          title: 'Not Supported',
          description: 'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.',
          variant: 'error',
        });
      }
      return;
    }
    setShowRecording(true);
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
    setShowRecording(false);
    setAudioLevel(0);
  };

  const handleAcceptTranscript = () => {
    const finalText = (transcript + ' ' + interimTranscript).trim();
    if (finalText) {
      onTranscript(finalText);
      resetTranscript();
    }
    handleStopRecording();
  };

  const handleCancel = () => {
    resetTranscript();
    handleStopRecording();
  };

  return (
    <>
      <button
        onClick={handleStartRecording}
        className={cn(
          "p-2 rounded-lg transition-colors",
          "hover:bg-hover text-secondary hover:text-primary",
          isListening && "bg-red-500/10 text-red-500 hover:bg-red-500/20",
          className
        )}
        aria-label={isListening ? "Stop recording" : "Start voice input"}
        title={isSupported ? "Voice input (speech to text)" : "Speech recognition not supported"}
        disabled={!isSupported}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      <AnimatePresence>
        {showRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl"
          >
            <div className="bg-bg-secondary rounded-2xl shadow-xl border border-border p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">Voice Input</h3>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-hover rounded-lg transition-colors"
                  aria-label="Cancel recording"
                >
                  <X className="w-5 h-5 text-secondary" />
                </button>
              </div>

              {/* Waveform visualization */}
              <div className="relative h-24 mb-4 bg-bg rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-accent rounded-full"
                      animate={{
                        height: isListening 
                          ? `${Math.max(8, (Math.sin(i * 0.2) * 0.5 + 0.5) * audioLevel * 80)}px`
                          : '8px',
                      }}
                      transition={{
                        duration: 0.1,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </div>
                
                {/* Recording indicator */}
                {isListening && (
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-secondary">Recording</span>
                  </div>
                )}
              </div>

              {/* Transcript */}
              <div className="min-h-[60px] max-h-[120px] overflow-y-auto bg-bg rounded-lg p-3 mb-4">
                <p className="text-primary">
                  {transcript}
                  <span className="text-muted">{interimTranscript}</span>
                </p>
                {!transcript && !interimTranscript && (
                  <p className="text-muted text-sm">Start speaking...</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptTranscript}
                  className="px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent-dark transition-colors flex items-center gap-2"
                  disabled={!transcript && !interimTranscript}
                >
                  <Check className="w-4 h-4" />
                  Accept
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}