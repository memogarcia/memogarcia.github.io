/**
 * SpeechInput Component
 * Speech-to-text input for creating documents
 */

const { useState, useRef, useEffect } = React;

// Simple icon components
const Mic = ({ className }) => React.createElement('span', { className, style: { fontSize: '16px' } }, '🎙️');
const MicOff = ({ className }) => React.createElement('span', { className, style: { fontSize: '16px' } }, '🔇');

function SpeechInput({ onTranscript, className = '' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText + ' ';
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript.trim() && onTranscript) {
          onTranscript(transcript.trim());
          setTranscript('');
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript, onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return React.createElement(
    'button',
    {
      onClick: toggleListening,
      className: window.cn(
        'flex items-center justify-center transition-colors',
        className,
        isListening && 'text-red-500 animate-pulse'
      ),
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.2s',
        backgroundColor: 'transparent',
        border: '1px solid var(--border)',
        color: isListening ? '#ef4444' : 'var(--text-secondary)',
        cursor: 'pointer',
        animation: isListening ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
      },
      'aria-label': isListening ? 'Stop voice input' : 'Start voice input',
      title: isListening ? 'Stop voice input' : 'Start voice input',
      onMouseEnter: (e) => {
        if (!isListening) {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.borderColor = 'var(--primary)';
        }
      },
      onMouseLeave: (e) => {
        if (!isListening) {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }
      }
    },
    isListening 
      ? React.createElement(MicOff, { className: 'w-4 h-4' })
      : React.createElement(Mic, { className: 'w-4 h-4' })
  );
}

// Make available globally
window.SpeechInput = SpeechInput;