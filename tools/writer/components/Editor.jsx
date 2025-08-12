/**
 * Editor Component - Migrated from TypeScript
 * Main editor container with 3-column layout support, speech recognition, and focus modes
 */

const { useState, useEffect, useRef } = React;

// Simple icon components
const Mic = ({ className }) => React.createElement('span', { className, style: { fontSize: '24px' } }, '🎙️');
const MicOff = ({ className }) => React.createElement('span', { className, style: { fontSize: '24px' } }, '🔇');

function Editor({ showBorders = true }) {
  const { 
    currentDocument, 
    editorMode, 
    selectedParagraphId, 
    selectParagraph, 
    addParagraph 
  } = window.useWriterStore();
  
  const [showHeaderBorder, setShowHeaderBorder] = useState(false);
  const [containerHeight, setContainerHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const scrollContainerRef = useRef(null);
  const contentRef = useRef(null);
  const editorRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setShowHeaderBorder(scrollContainerRef.current.scrollTop > 10);
      }
    };

    const handleResize = () => {
      if (editorRef.current) {
        // Calculate the actual available height for the content
        const headerHeight = 64; // Approximate header height
        const availableHeight = editorRef.current.clientHeight - headerHeight;
        setContainerHeight(Math.max(400, availableHeight));
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Keyboard navigation for focus mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if not in an input/textarea
      const target = e.target;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return;
      }
      
      if (editorMode === 'focus' && currentDocument && currentDocument.paragraphs.length > 0) {
        const currentIndex = currentDocument.paragraphs.findIndex(p => p.id === selectedParagraphId);
        
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          e.preventDefault();
          e.stopPropagation();
          selectParagraph(currentDocument.paragraphs[currentIndex - 1].id);
        } else if (e.key === 'ArrowDown' && currentIndex < currentDocument.paragraphs.length - 1) {
          e.preventDefault();
          e.stopPropagation();
          selectParagraph(currentDocument.paragraphs[currentIndex + 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [editorMode, currentDocument, selectedParagraphId, selectParagraph]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setSpeechText(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Add the speech text as a new paragraph if there's any
        if (speechText.trim()) {
          addParagraph(speechText.trim());
          setSpeechText('');
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [speechText, addParagraph]);

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (!currentDocument) {
    return React.createElement(
      'div',
      {
        className: 'flex-1 flex items-center justify-center',
        style: {
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        },
        role: 'status',
        'aria-label': 'No document selected'
      },
      React.createElement('p', {}, 'Select or create a document to start writing')
    );
  }

  return React.createElement(
    'div',
    {
      ref: editorRef,
      className: 'h-full flex flex-col relative',
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'var(--background)'
      }
    },
    // Vignette effect for focus mode
    editorMode === 'focus' && React.createElement('div', {
      className: 'pointer-events-none fixed inset-0 z-10',
      style: {
        pointerEvents: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.1) 100%)'
      }
    }),
    
    React.createElement(window.EditorHeader, { 
      showBorders: showBorders && showHeaderBorder 
    }),
    
    React.createElement(
      'div',
      {
        className: 'flex-1 flex flex-col min-h-0',
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }
      },
      React.createElement(
        'div',
        {
          ref: scrollContainerRef,
          className: window.cn(
            'flex-1 overflow-y-auto',
            editorMode === 'focus' && 'focus-mode-scroll'
          ),
          style: {
            flex: 1,
            overflowY: 'auto',
            scrollBehavior: 'smooth'
          }
        },
        React.createElement(
          'div',
          {
            ref: contentRef,
            className: 'max-w-4xl w-full mx-auto px-8',
            style: {
              maxWidth: '56rem',
              width: '100%',
              marginLeft: 'auto',
              marginRight: 'auto',
              padding: '0 32px'
            }
          },
          React.createElement(
            'div',
            {
              className: 'py-8',
              style: { padding: '32px 0' }
            },
            React.createElement(window.ParagraphList)
          )
        )
      )
    ),
    
    // Floating Speech-to-Text Button
    React.createElement(
      'button',
      {
        onClick: toggleDictation,
        className: window.cn(
          'fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all z-50',
          isListening 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-accent text-white hover:bg-accent-dark'
        ),
        style: {
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '16px',
          borderRadius: '50%',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s',
          zIndex: 50,
          backgroundColor: isListening ? '#ef4444' : 'var(--primary)',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        },
        'aria-label': isListening ? 'Stop voice dictation' : 'Start voice dictation',
        'aria-pressed': isListening,
        title: isListening ? 'Stop dictation' : 'Start dictation',
        onMouseEnter: (e) => {
          e.currentTarget.style.backgroundColor = isListening ? '#dc2626' : 'var(--primary-dark)';
          e.currentTarget.style.transform = 'scale(1.1)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.backgroundColor = isListening ? '#ef4444' : 'var(--primary)';
          e.currentTarget.style.transform = 'scale(1)';
        }
      },
      isListening 
        ? React.createElement(MicOff, { className: 'w-6 h-6', 'aria-hidden': 'true' })
        : React.createElement(Mic, { className: 'w-6 h-6', 'aria-hidden': 'true' })
    ),
    
    // Speech text display
    isListening && speechText && React.createElement(
      'div',
      {
        className: 'fixed bottom-24 right-6 max-w-xs p-3 rounded-lg shadow-lg z-50',
        style: {
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          maxWidth: '320px',
          padding: '12px',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
          zIndex: 50
        },
        role: 'status',
        'aria-live': 'polite',
        'aria-label': 'Dictation in progress'
      },
      React.createElement(
        'p',
        {
          className: 'text-sm',
          style: {
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: 0
          }
        },
        speechText
      )
    ),
    
    // Screen reader announcements for editor mode changes
    React.createElement(
      'div',
      {
        'aria-live': 'polite',
        'aria-atomic': 'true',
        className: 'sr-only',
        style: {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0'
        }
      },
      editorMode === 'focus' && 'Focus mode activated. Use arrow keys to navigate paragraphs.',
      editorMode === 'preview' && 'Preview mode activated. Content is read-only.',
      editorMode === 'edit' && 'Edit mode activated. Click paragraphs to edit.'
    )
  );
}

// Make available globally
window.Editor = Editor;