/**
 * ParagraphItem Component - Migrated from TypeScript
 * Individual paragraph editing with drag & drop, focus effects, and advanced interactions
 */

const { useState, useRef, useEffect, useCallback, useMemo } = React;
const { useSortable } = window.DndKitSortable || {};
const { CSS } = window.DndKitUtilities || {};
const { motion } = window.FramerMotion || {};

// Simple icon components
const MoveVertical = ({ className }) => React.createElement('span', { className }, '⋮⋮');
const Copy = ({ className }) => React.createElement('span', { className }, '📋');
const X = ({ className }) => React.createElement('span', { className }, '✕');

function ParagraphItem({ paragraph, index }) {
  // Get store functions
  const { 
    updateParagraph, 
    deleteParagraph, 
    addToClipboard, 
    selectParagraph,
    selectedParagraphId, 
    globalPreviewMode, 
    editorMode, 
    editorSettings, 
    currentDocument, 
    searchTerm,
    addParagraphAfter
  } = window.useWriterStore();
  
  const [isEditing, setIsEditing] = useState(paragraph.content === '');
  const [editContent, setEditContent] = useState(paragraph.content);
  const [lastEnterTime, setLastEnterTime] = useState(0);
  const textareaRef = useRef(null);
  const paragraphRef = useRef(null);
  
  // DnD Kit sortable hook (if available)
  const sortable = useSortable ? useSortable({ id: paragraph.id }) : {
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false
  };
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = sortable;

  const style = {
    transform: CSS?.Transform?.toString(transform) || '',
    transition: transition || ''
  };

  const isSelected = selectedParagraphId === paragraph.id;
  const isFocusMode = editorMode === 'focus';
  const isCurrentParagraph = isFocusMode && isSelected;
  
  // Memoize expensive calculations for focus effects
  const { opacity, blurAmount, scaleAmount } = useMemo(() => {
    if (!isFocusMode) {
      return { opacity: 1, blurAmount: 0, scaleAmount: 1 };
    }
    
    // Calculate distance from selected paragraph for focus effect
    const selectedIndex = currentDocument && currentDocument.paragraphs ? currentDocument.paragraphs.findIndex(p => p.id === selectedParagraphId) : -1;
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

  // Auto-resize textarea and focus management
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

  // Auto-resize on content change
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
          const scrollContainer = paragraphRef.current.closest('.overflow-y-auto') || 
                                 paragraphRef.current.closest('[style*="overflow-y: auto"]') ||
                                 document.querySelector('[ref="scrollContainerRef"]') ||
                                 window;
          
          if (scrollContainer && scrollContainer !== window) {
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
        let currentId = paragraph.id;
        
        for (let i = 1; i < parts.length; i++) {
          const newId = addParagraphAfter(parts[i].trim(), currentId);
          currentId = newId;
        }
        
        // Show a toast notification
        if (window.useToast) {
          const { toast } = window.useToast();
          toast({
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
  }, [editContent, paragraph.id, paragraph.content, updateParagraph, addParagraphAfter]);

  const handleKeyDown = useCallback((e) => {
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
  }, [editContent, paragraph.id, deleteParagraph, updateParagraph, handleSave, lastEnterTime, addParagraphAfter]);

  const handleCopyToClipboard = useCallback(() => {
    addToClipboard(paragraph.content, 'Copied from document', paragraph.id, currentDocument?.id);
  }, [paragraph.content, paragraph.id, currentDocument?.id, addToClipboard]);

  const handleTextDragStart = useCallback((e) => {
    // Get selected text or full paragraph content
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : '';
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

  // Create motion div props
  const motionProps = motion ? {
    initial: { boxShadow: 'inset 0 0 0 2px transparent' },
    animate: { 
      boxShadow: ['inset 0 0 0 2px #10a37f', 'inset 0 0 0 2px transparent'],
    },
    transition: {
      boxShadow: {
        duration: 1.5,
        ease: 'easeOut',
      },
    }
  } : {};

  const MotionDiv = motion ? motion.div : 'div';

  return React.createElement(
    'div',
    {
      ref: paragraphRef,
      className: window.cn('transition-all duration-500 ease-out py-1'),
      style: {
        opacity: opacity,
        filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
        transform: `scale(${scaleAmount})`,
        transformOrigin: 'center',
        transition: 'all 0.5s ease-out',
        paddingTop: '4px',
        paddingBottom: '4px'
      }
    },
    React.createElement(
      MotionDiv,
      {
        id: `paragraph-${paragraph.id}`,
        ref: setNodeRef,
        style: {
          ...style,
          borderRadius: '0.5rem',
          padding: '0.625rem'
        },
        className: window.cn(
          'group relative',
          isDragging && 'opacity-50'
        ),
        onClick: (e) => {
          e.stopPropagation();
          selectParagraph(paragraph.id);
          if (!isEditing && !isDragging && !globalPreviewMode) {
            setIsEditing(true);
          }
        },
        role: 'article',
        'aria-label': `Paragraph ${index + 1}${isSelected ? ' (selected)' : ''}`,
        'aria-selected': isSelected,
        tabIndex: isEditing ? -1 : 0,
        onKeyDown: (e) => {
          if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            selectParagraph(paragraph.id);
            if (!globalPreviewMode) {
              setIsEditing(true);
            }
          }
        },
        ...motionProps
      },
      React.createElement(
        'div',
        {
          className: 'flex gap-2',
          style: { display: 'flex', gap: '8px' }
        },
        // Drag Handle with Visual Indicator
        !globalPreviewMode && editorMode !== 'focus' && React.createElement(
          'div',
          {
            ...attributes,
            ...listeners,
            className: window.cn(
              'flex items-start pt-2 cursor-move opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110'
            ),
            style: {
              display: 'flex',
              alignItems: 'flex-start',
              paddingTop: '8px',
              cursor: 'move',
              opacity: 0,
              transition: 'all 0.2s',
              color: 'var(--text-secondary)'
            },
            'aria-label': `Drag to reorder paragraph ${index + 1}`,
            role: 'button',
            tabIndex: 0,
            onMouseEnter: (e) => {
              e.currentTarget.style.opacity = 1;
              e.currentTarget.style.color = 'var(--text-primary)';
            },
            onMouseLeave: (e) => {
              if (!e.currentTarget.parentElement.matches(':hover')) {
                e.currentTarget.style.opacity = 0;
              }
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          },
          React.createElement(MoveVertical, { className: 'w-5 h-5' })
        ),

        // Content
        React.createElement(
          'div',
          {
            className: 'flex-1',
            style: { flex: 1 },
            draggable: !isEditing && !isDragging,
            onDragStart: handleTextDragStart,
            title: !isEditing ? "Select text and drag to clipboard" : undefined
          },
          isEditing 
            ? React.createElement(
                'div',
                { className: 'relative', style: { position: 'relative' } },
                React.createElement('textarea', {
                  ref: textareaRef,
                  value: editContent,
                  onChange: (e) => setEditContent(e.target.value),
                  onKeyDown: handleKeyDown,
                  onBlur: handleSave,
                  className: window.cn(
                    'editor-content max-w-none w-full bg-transparent focus:outline-none resize-none break-words overflow-hidden rounded-lg p-2 -m-2'
                  ),
                  style: {
                    fontFamily: editorSettings?.fontFamily || 'system-ui, -apple-system, sans-serif',
                    fontSize: `${editorSettings?.fontSize || 16}px`,
                    lineHeight: '1.8',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    width: '100%',
                    minHeight: !editContent ? '40px' : 'auto',
                    resize: 'none',
                    outline: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    margin: '-8px'
                  },
                  placeholder: "Click to start writing...",
                  'aria-label': `Edit paragraph ${index + 1}`,
                  'aria-describedby': `paragraph-help-${paragraph.id}`
                }),
                React.createElement(
                  'div',
                  { 
                    id: `paragraph-help-${paragraph.id}`, 
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
                  'Use Cmd/Ctrl+Enter to save, Shift+Enter to split paragraph, Escape to finish editing'
                )
              )
            : React.createElement(
                'div',
                {
                  className: window.cn(
                    'editor-content max-w-none rounded-lg p-2 -m-2 transition-colors select-text',
                    !globalPreviewMode && 'cursor-text hover:bg-hover/50',
                    !paragraph.content && 'min-h-[40px] flex items-center'
                  ),
                  style: {
                    fontFamily: editorSettings?.fontFamily || 'system-ui, -apple-system, sans-serif',
                    fontSize: `${editorSettings?.fontSize || 16}px`,
                    lineHeight: '1.8',
                    borderRadius: '8px',
                    padding: '8px',
                    margin: '-8px',
                    transition: 'background-color 0.2s',
                    cursor: !globalPreviewMode ? 'text' : 'default',
                    minHeight: !paragraph.content ? '40px' : 'auto',
                    display: !paragraph.content ? 'flex' : 'block',
                    alignItems: !paragraph.content ? 'center' : 'unset',
                    userSelect: 'text'
                  },
                  onClick: () => {
                    if (!globalPreviewMode) {
                      setIsEditing(true);
                    }
                  },
                  onMouseEnter: (e) => {
                    if (!globalPreviewMode) {
                      e.currentTarget.style.backgroundColor = 'rgba(64, 748, 180, 0.05)';
                    }
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                },
                paragraph.content 
                  ? (searchTerm
                      ? React.createElement(
                          'div',
                          { className: 'markdown-content' },
                          React.createElement(window.HighlightedText, {
                            text: paragraph.content,
                            searchTerm: searchTerm,
                            highlightClassName: 'bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded'
                          })
                        )
                      : React.createElement(window.SanitizedMarkdown, { content: paragraph.content })
                    )
                  : React.createElement(
                      'span',
                      { 
                        className: 'text-muted italic',
                        style: { color: 'var(--text-secondary)', fontStyle: 'italic' }
                      },
                      'Click to start writing...'
                    )
              )
        ),

        // Actions
        !globalPreviewMode && editorMode !== 'focus' && React.createElement(
          'div',
          {
            className: window.cn('flex items-start gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity'),
            style: {
              display: 'flex',
              alignItems: 'flex-start',
              gap: '4px',
              paddingTop: '8px',
              opacity: 0,
              transition: 'opacity 0.2s'
            },
            role: 'group',
            'aria-label': `Actions for paragraph ${index + 1}`,
            onMouseEnter: (e) => {
              e.currentTarget.style.opacity = 1;
            },
            onMouseLeave: (e) => {
              if (!e.currentTarget.parentElement.matches(':hover')) {
                e.currentTarget.style.opacity = 0;
              }
            }
          },
          React.createElement(
            'button',
            {
              onClick: (e) => {
                e.stopPropagation();
                handleCopyToClipboard();
              },
              className: 'p-1 hover:bg-hover rounded transition-colors',
              style: {
                padding: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                color: 'var(--text-secondary)'
              },
              'aria-label': `Copy paragraph ${index + 1} to clipboard`,
              title: 'Copy to clipboard',
              onMouseEnter: (e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface)';
                e.currentTarget.style.color = 'var(--primary)';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            },
            React.createElement(Copy, { className: 'w-4 h-4' })
          ),
          React.createElement(
            'button',
            {
              onClick: (e) => {
                e.stopPropagation();
                if (window.confirm('Delete this paragraph?')) {
                  deleteParagraph(paragraph.id);
                }
              },
              className: 'p-1 hover:bg-hover rounded transition-colors',
              style: {
                padding: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                color: 'var(--text-secondary)'
              },
              'aria-label': `Delete paragraph ${index + 1}`,
              title: 'Delete paragraph',
              onMouseEnter: (e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface)';
                e.currentTarget.style.color = '#ef4444';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            },
            React.createElement(X, { className: 'w-4 h-4' })
          )
        )
      )
    )
  );
}

// Make available globally
window.ParagraphItem = ParagraphItem;