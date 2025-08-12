import { useState, useRef, useEffect } from 'react';
import { useWriterStore } from '../store/local-store';
import { Plus, Send } from 'lucide-react';
import { cn } from '../utils/cn';
import { smartSplitParagraphs } from '../utils/textParser';
import { SpeechInput } from './SpeechInput';

interface EditorInputProps {
  onStartComposing: () => void;
  onStopComposing: () => void;
  minimal?: boolean;
}

export function EditorInput({ onStartComposing, onStopComposing, minimal = false }: EditorInputProps) {
  const { addParagraph, currentDocument, editorSettings } = useWriterStore();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);


  const handleSubmit = () => {
    if (content.trim()) {
      // Check if the content has multiple paragraphs
      const paragraphs = smartSplitParagraphs(content);
      
      if (paragraphs.length > 1) {
        // Add multiple paragraphs
        paragraphs.forEach((paragraph) => {
          if (paragraph.trim()) {
            addParagraph(paragraph.trim());
          }
        });
      } else {
        // Add single paragraph
        addParagraph(content.trim());
      }
      
      setContent('');
      setIsExpanded(false);
      onStopComposing();
    }
  };


  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      const paragraphs = smartSplitParagraphs(pastedText);
      if (paragraphs.length > 1) {
        // Show a visual indicator that text will be split
        // You could add a toast notification here if desired
        console.log(`Pasted text will be split into ${paragraphs.length} paragraphs`);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleSubmit();
      } else if (!e.shiftKey && minimal) {
        // Allow regular enter to submit in minimal mode
        e.preventDefault();
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setContent('');
      setIsExpanded(false);
      onStopComposing();
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
    onStartComposing();
  };

  const handleBlur = () => {
    if (!content.trim() && !minimal) {
      setIsExpanded(false);
      onStopComposing();
    }
  };

  if (!currentDocument) return null;

  if (minimal) {
    return (
      <div className="relative flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={handleFocus}
          placeholder="Let your ideas flow..."
          className={cn(
            "flex-1 px-4 py-3 bg-bg border border-border rounded-xl",
            "focus:outline-none focus:border-secondary",
            "resize-none",
            "placeholder:text-muted min-h-[52px] max-h-[200px]"
          )}
          style={{
            fontFamily: editorSettings?.fontFamily,
            fontSize: `${editorSettings?.fontSize}px`,
          }}
          rows={1}
        />
        <SpeechInput
          onTranscript={(text) => {
            setContent(prev => prev + (prev ? ' ' : '') + text);
            if (!isExpanded) {
              handleFocus();
            }
          }}
          className="p-3 rounded-xl bg-hover text-secondary hover:bg-border transition-colors"
        />
        {content.trim() && (
          <button
            onClick={handleSubmit}
            className="p-3 bg-accent text-white rounded-xl hover:bg-accent-dark transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {!isExpanded ? (
        <button
          onClick={handleFocus}
          className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-primary hover:bg-hover rounded-lg transition-colors group"
        >
          <Plus className="w-5 h-5 group-hover:text-primary transition-colors" />
          <span className="text-left">Add a paragraph...</span>
        </button>
      ) : (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
            placeholder="Write your paragraph here... (Markdown supported)"
            className={cn(
              "w-full px-4 py-3 bg-bg border-2 border-primary/20 rounded-lg",
              "focus:outline-none focus:border-primary/50",
              "leading-relaxed resize-none",
              "placeholder:text-muted min-h-[100px]"
            )}
            style={{
              fontFamily: editorSettings?.fontFamily,
              fontSize: `${editorSettings?.fontSize}px`,
            }}
          />
          <div className="flex items-center justify-between text-sm text-muted">
            <div className="flex items-center gap-3">
              <span>Markdown supported • Press ⌘+Enter to add</span>
              <SpeechInput
                onTranscript={(text) => {
                  setContent(prev => prev + (prev ? ' ' : '') + text);
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setContent('');
                  setIsExpanded(false);
                  onStopComposing();
                }}
                className="px-3 py-1 hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className={cn(
                  "px-4 py-1 rounded-md font-medium transition-colors",
                  content.trim()
                    ? "bg-accent text-white hover:bg-accent-dark"
                    : "bg-hover text-muted cursor-not-allowed"
                )}
              >
                Add Paragraph
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}