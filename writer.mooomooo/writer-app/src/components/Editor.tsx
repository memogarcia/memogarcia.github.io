import { useState, useEffect, useRef, memo } from 'react';
import { useWriterStore } from '../store';
import { EditorHeader } from './EditorHeader';
import { ParagraphList } from './ParagraphList';
import { VirtualizedParagraphList } from './VirtualizedParagraphList';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '../utils/cn';

interface EditorProps {
  showBorders?: boolean;
}

export const Editor = memo(function Editor({ showBorders = true }: EditorProps) {
  const { currentDocument, editorMode, selectedParagraphId, selectParagraph, addParagraph } = useWriterStore();
  const [showHeaderBorder, setShowHeaderBorder] = useState(false);
  const [containerHeight, setContainerHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input/textarea
      const target = e.target as HTMLElement;
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
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
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

      recognitionRef.current.onerror = (event: any) => {
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
    return (
      <div className="flex-1 flex items-center justify-center text-muted" role="status" aria-label="No document selected">
        <p>Select or create a document to start writing</p>
      </div>
    );
  }

  return (
    <div ref={editorRef} className="h-full flex flex-col bg-bg relative">
      {/* Vignette effect for focus mode */}
      {editorMode === 'focus' && (
        <div 
          className="pointer-events-none fixed inset-0 z-10"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.1) 100%)',
          }}
        />
      )}
      <EditorHeader showBorders={showBorders && showHeaderBorder} />
      
      <div className="flex-1 flex flex-col min-h-0">
        <div ref={scrollContainerRef} className={cn(
          "flex-1 overflow-y-auto",
          editorMode === 'focus' && "focus-mode-scroll"
        )}>
          <div ref={contentRef} className="max-w-4xl w-full mx-auto px-8">
            <div className="py-8">
              {currentDocument && currentDocument.paragraphs.length > 50 ? (
                <VirtualizedParagraphList height={containerHeight} />
              ) : (
                <ParagraphList />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Speech-to-Text Button */}
      <button
        onClick={toggleDictation}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all z-50",
          isListening 
            ? "bg-red-500 text-white hover:bg-red-600" 
            : "bg-accent text-white hover:bg-accent-dark"
        )}
        aria-label={isListening ? "Stop voice dictation" : "Start voice dictation"}
        aria-pressed={isListening}
        title={isListening ? "Stop dictation" : "Start dictation"}
      >
        {isListening ? 
          <MicOff className="w-6 h-6" aria-hidden="true" /> : 
          <Mic className="w-6 h-6" aria-hidden="true" />
        }
      </button>
      
      {/* Speech text display */}
      {isListening && speechText && (
        <div 
          className="fixed bottom-24 right-6 max-w-xs p-3 bg-bg border border-border rounded-lg shadow-lg z-50"
          role="status"
          aria-live="polite"
          aria-label="Dictation in progress"
        >
          <p className="text-sm text-secondary">{speechText}</p>
        </div>
      )}
      
      {/* Screen reader announcements for editor mode changes */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {editorMode === 'focus' && 'Focus mode activated. Use arrow keys to navigate paragraphs.'}
        {editorMode === 'preview' && 'Preview mode activated. Content is read-only.'}
        {editorMode === 'edit' && 'Edit mode activated. Click paragraphs to edit.'}
      </div>
    </div>
  );
});