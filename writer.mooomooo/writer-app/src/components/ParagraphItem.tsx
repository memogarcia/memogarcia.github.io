import { useState, useRef, useEffect, memo, DragEvent, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, MoveVertical, Copy } from 'lucide-react';
import { useWriterStore } from '../store';
import { Paragraph } from '../types';
import { cn } from '../utils/cn';
import { HighlightedText } from '../utils/highlightText';
import { SanitizedMarkdown } from './SanitizedMarkdown';
import { shallow } from 'zustand/shallow';

interface ParagraphItemProps {
  paragraph: Paragraph;
  index: number;
}

export const ParagraphItem = memo(function ParagraphItem({ paragraph, index }: ParagraphItemProps) {
  // Use selectors to minimize re-renders
  const updateParagraph = useWriterStore(state => state.updateParagraph);
  const deleteParagraph = useWriterStore(state => state.deleteParagraph);
  const addToClipboard = useWriterStore(state => state.addToClipboard);
  const selectParagraph = useWriterStore(state => state.selectParagraph);
  
  const { selectedParagraphId, globalPreviewMode, editorMode, editorSettings, currentDocument, searchTerm } = useWriterStore(
    state => ({
      selectedParagraphId: state.selectedParagraphId,
      globalPreviewMode: state.globalPreviewMode,
      editorMode: state.editorMode,
      editorSettings: state.editorSettings,
      currentDocument: state.currentDocument,
      searchTerm: state.searchTerm,
    }),
    shallow
  );
  
  const [isEditing, setIsEditing] = useState(paragraph.content === '');
  const [editContent, setEditContent] = useState(paragraph.content);
  const [lastEnterTime, setLastEnterTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const paragraphRef = useRef<HTMLDivElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: paragraph.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedParagraphId === paragraph.id;
  const isFocusMode = editorMode === 'focus';
  const isCurrentParagraph = isFocusMode && isSelected;
  
  // Memoize expensive calculations
  const { opacity, blurAmount, scaleAmount } = useMemo(() => {
    if (!isFocusMode) {
      return { opacity: 1, blurAmount: 0, scaleAmount: 1 };
    }
    
    // Calculate distance from selected paragraph for focus effect
    const selectedIndex = currentDocument?.paragraphs.findIndex(p => p.id === selectedParagraphId) ?? -1;
    const distance = Math.abs(index - selectedIndex);
    
    // Smoother gradient effect like AI Writer
    const opacity = isCurrentParagraph ? 1 : 
      distance === 1 ? 0.7 : 
      distance === 2 ? 0.4 : 
      distance === 3 ? 0.25 : 
      0.15;
    
    // Progressive blur based on distance
    const blurAmount = isCurrentParagraph ? 0 :
      distance === 1 ? 0.5 :
      distance === 2 ? 1 :
      distance === 3 ? 1.5 :
      2;
    
    // Subtle scale for depth perception
    const scaleAmount = isCurrentParagraph ? 1 :
      distance === 1 ? 0.98 :
      distance === 2 ? 0.96 :
      0.95;
      
    return { opacity, blurAmount, scaleAmount };
  }, [isFocusMode, isCurrentParagraph, index, selectedParagraphId, currentDocument?.paragraphs]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editContent]);

  // Scroll to center when paragraph is selected in focus mode
  useEffect(() => {
    if (isCurrentParagraph && paragraphRef.current) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        if (paragraphRef.current) {
          // Find the scroll container
          const scrollContainer = paragraphRef.current.closest('.overflow-y-auto');
          if (scrollContainer) {
            const element = paragraphRef.current;
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            // Calculate the position to center the element
            const elementTop = element.offsetTop;
            const elementHeight = elementRect.height;
            const containerHeight = containerRect.height;
            
            const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);
            
            scrollContainer.scrollTo({
              top: scrollTo,
              behavior: 'smooth'
            });
          }
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isCurrentParagraph]);

  const handleSave = useCallback(() => {
    const trimmedContent = editContent.trim();
    
    // Check if content contains double newlines (paragraph breaks)
    if (trimmedContent.includes('\n\n')) {
      // Split by double newlines and create multiple paragraphs
      const parts = trimmedContent.split('\n\n').filter(part => part.trim());
      
      if (parts.length > 1) {
        // Update the current paragraph with the first part
        updateParagraph(paragraph.id, parts[0].trim());
        
        // Add the remaining parts as new paragraphs after the current one
        const { addParagraphAfter } = useWriterStore.getState();
        let currentId = paragraph.id;
        
        for (let i = 1; i < parts.length; i++) {
          const newId = addParagraphAfter(parts[i].trim(), currentId);
          currentId = newId;
        }
        
        // Show a toast notification
        if ((window as any).showToast) {
          (window as any).showToast({
            title: 'Paragraphs split',
            description: `Split into ${parts.length} paragraphs`,
            variant: 'success',
          });
        }
      } else if (parts.length === 1) {
        // Just one paragraph after splitting, update normally
        updateParagraph(paragraph.id, parts[0].trim());
      }
    } else if (trimmedContent !== paragraph.content) {
      // No double newlines, update normally
      updateParagraph(paragraph.id, trimmedContent);
    }
  }, [editContent, paragraph.id, paragraph.content, updateParagraph]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle delete/backspace key for empty paragraphs
    if ((e.key === 'Delete' || e.key === 'Backspace') && editContent.trim() === '') {
      e.preventDefault();
      deleteParagraph(paragraph.id);
      return;
    }
    
    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleSave();
        setIsEditing(false);
      } else if (e.shiftKey) {
        // Shift+Enter: Split paragraph at cursor
        e.preventDefault();
        
        if (textareaRef.current) {
          const cursorPos = textareaRef.current.selectionStart;
          const beforeCursor = editContent.substring(0, cursorPos).trim();
          const afterCursor = editContent.substring(cursorPos).trim();
          
          // Update current paragraph with content before cursor
          if (beforeCursor) {
            updateParagraph(paragraph.id, beforeCursor);
          } else {
            // If nothing before cursor, delete this paragraph
            deleteParagraph(paragraph.id);
          }
          
          // Add new paragraph with content after cursor
          if (afterCursor) {
            const { addParagraphAfter } = useWriterStore.getState();
            addParagraphAfter(afterCursor, paragraph.id);
          }
          
          setIsEditing(false);
        }
      } else if (!e.shiftKey) {
        // Check for double-enter
        const currentTime = Date.now();
        const timeSinceLastEnter = currentTime - lastEnterTime;
        
        if (timeSinceLastEnter < 500 && textareaRef.current) {
          // Double-enter detected
          e.preventDefault();
          
          // Save current paragraph if it has content
          if (editContent.trim()) {
            updateParagraph(paragraph.id, editContent.trim());
          }
          
          // Add new paragraph after this one
          const { addParagraphAfter } = useWriterStore.getState();
          addParagraphAfter('', paragraph.id);
          
          // Focus will be handled by the new paragraph
          setIsEditing(false);
        } else {
          // Single enter - update the time
          setLastEnterTime(currentTime);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleSave();
      setIsEditing(false);
    }
  }, [editContent, paragraph.id, deleteParagraph, updateParagraph, handleSave, lastEnterTime]);

  const handleCopyToClipboard = useCallback(() => {
    addToClipboard(paragraph.content, 'Copied from document', paragraph.id, currentDocument?.id);
  }, [paragraph.content, paragraph.id, currentDocument?.id, addToClipboard]);

  const handleTextDragStart = useCallback((e: DragEvent<HTMLDivElement>) => {
    // Get selected text or full paragraph content
    const selection = window.getSelection();
    const selectedText = selection?.toString();
    const textToDrag = selectedText || paragraph.content;
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', textToDrag);
    if (!selectedText) {
      // Only set paragraph reference if dragging entire paragraph
      e.dataTransfer.setData('paragraph-id', paragraph.id);
      e.dataTransfer.setData('document-id', currentDocument?.id || '');
    }
  }, [paragraph.content, paragraph.id, currentDocument?.id]);

  return (
    <div
      ref={paragraphRef}
      className={cn(
        "transition-all duration-500 ease-out py-1"
      )}
      style={{
        opacity: opacity,
        filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
        transform: `scale(${scaleAmount})`,
        transformOrigin: 'center',
      }}
    >
      <motion.div
        id={`paragraph-${paragraph.id}`}
        ref={setNodeRef}
        style={{
          ...style,
          borderRadius: '0.5rem',
          padding: '0.625rem', // 10px (0.5rem + 2px for border space)
        }}
        className={cn(
          "group relative",
          isDragging && "opacity-50"
        )}
        onClick={(e) => {
          e.stopPropagation();
          selectParagraph(paragraph.id);
          if (!isEditing && !isDragging && !globalPreviewMode) {
            setIsEditing(true);
          }
        }}
        role="article"
        aria-label={`Paragraph ${index + 1}${isSelected ? ' (selected)' : ''}`}
        aria-selected={isSelected}
        tabIndex={isEditing ? -1 : 0}
        onKeyDown={(e) => {
          if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            selectParagraph(paragraph.id);
            if (!globalPreviewMode) {
              setIsEditing(true);
            }
          }
        }}
        initial={{ boxShadow: 'inset 0 0 0 2px transparent' }}
        animate={{ 
          boxShadow: ['inset 0 0 0 2px #10a37f', 'inset 0 0 0 2px transparent'],
        }}
        transition={{
          boxShadow: {
            duration: 1.5,
            ease: 'easeOut',
          },
        }}
      >
      <div className="flex gap-2">
        {/* Drag Handle with Visual Indicator */}
        {!globalPreviewMode && editorMode !== 'focus' && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "flex items-start pt-2 cursor-move opacity-0 group-hover:opacity-100 transition-all duration-200",
            "hover:text-primary hover:scale-110"
          )}
          aria-label={`Drag to reorder paragraph ${index + 1}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              // Focus management for drag and drop with keyboard
            }
          }}
        >
          <MoveVertical className="w-5 h-5" aria-hidden="true" />
        </div>
        )}

        {/* Content */}
        <div 
          className="flex-1"
          draggable={!isEditing && !isDragging}
          onDragStart={handleTextDragStart}
          title={!isEditing ? "Select text and drag to clipboard" : undefined}
        >
          {isEditing ? (
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className={cn(
                  "editor-content max-w-none w-full bg-transparent",
                  "focus:outline-none resize-none",
                  "break-words overflow-hidden",
                  "rounded-lg p-2 -m-2",
                  !editContent && "min-h-[40px]"
                )}
                style={{
                  fontFamily: editorSettings?.fontFamily,
                  fontSize: `${editorSettings?.fontSize}px`,
                  lineHeight: '1.8',
                  border: 'none',
                }}
                placeholder="Click to start writing..."
                aria-label={`Edit paragraph ${index + 1}`}
                aria-describedby={`paragraph-help-${paragraph.id}`}
              />
              <div id={`paragraph-help-${paragraph.id}`} className="sr-only">
                Use Cmd/Ctrl+Enter to save, Shift+Enter to split paragraph, Escape to finish editing
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "editor-content max-w-none rounded-lg p-2 -m-2 transition-colors select-text",
                !globalPreviewMode && "cursor-text hover:bg-hover/50",
                !paragraph.content && "min-h-[40px] flex items-center",
                "selection:bg-accent/30"
              )}
              style={{
                fontFamily: editorSettings?.fontFamily,
                fontSize: `${editorSettings?.fontSize}px`,
                lineHeight: '1.8',
              }}
              onClick={() => {
                if (!globalPreviewMode) {
                  setIsEditing(true);
                }
              }}
            >
              {paragraph.content ? (
                searchTerm ? (
                  <div className="markdown-content">
                    <HighlightedText 
                      text={paragraph.content} 
                      searchTerm={searchTerm}
                      highlightClassName="bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded"
                    />
                  </div>
                ) : (
                  <SanitizedMarkdown content={paragraph.content} />
                )
              ) : (
                <span className="text-muted italic">Click to start writing...</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!globalPreviewMode && editorMode !== 'focus' && (
        <div className={cn(
          "flex items-start gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity"
        )} role="group" aria-label={`Actions for paragraph ${index + 1}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyToClipboard();
            }}
            className="p-1 hover:bg-hover rounded transition-colors"
            aria-label={`Copy paragraph ${index + 1} to clipboard`}
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4 text-secondary hover:text-accent" aria-hidden="true" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this paragraph?')) {
                deleteParagraph(paragraph.id);
              }
            }}
            className="p-1 hover:bg-hover rounded transition-colors"
            aria-label={`Delete paragraph ${index + 1}`}
            title="Delete paragraph"
          >
            <X className="w-4 h-4 text-secondary hover:text-red-500" aria-hidden="true" />
          </button>
        </div>
        )}
      </div>
      </motion.div>
    </div>
  );
});