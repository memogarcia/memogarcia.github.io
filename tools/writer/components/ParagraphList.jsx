/**
 * ParagraphList Component - Migrated from TypeScript
 * Drag & drop reordering with interactive add-paragraph functionality
 */

const { useEffect, useState } = React;
const { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } = window.DndKitCore || {};
const { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } = window.DndKitSortable || {};

function ParagraphList() {
  const { 
    currentDocument, 
    reorderParagraphs, 
    editorMode, 
    selectedParagraphId, 
    selectParagraph, 
    addParagraph 
  } = window.useWriterStore();
  
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  // Initialize sensors for drag and drop (if DnD Kit is available)
  const sensors = useSensors && PointerSensor && KeyboardSensor ? useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  ) : [];

  // Auto-select first paragraph in focus mode if none selected
  useEffect(() => {
    if (editorMode === 'focus' && !selectedParagraphId && currentDocument && currentDocument.paragraphs && currentDocument.paragraphs.length > 0) {
      selectParagraph(currentDocument.paragraphs[0].id);
    }
  }, [editorMode]); // Only run when editorMode changes

  if (!currentDocument || currentDocument.paragraphs.length === 0) {
    return React.createElement(
      'div',
      {
        className: 'text-center py-16 cursor-text min-h-[400px] flex items-center justify-center',
        style: {
          textAlign: 'center',
          padding: '64px 0',
          cursor: 'text',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        },
        onClick: () => {
          // Create first paragraph when clicking on empty document
          addParagraph('');
        }
      },
      React.createElement(
        'div',
        {},
        React.createElement(
          'p',
          {
            className: 'text-lg mb-2',
            style: { fontSize: '1.125rem', marginBottom: '8px' }
          },
          'Your document is empty'
        ),
        React.createElement(
          'p',
          {
            className: 'text-sm',
            style: { fontSize: '0.875rem' }
          },
          'Click anywhere to start writing'
        )
      )
    );
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== (over ? over.id : null)) {
      const oldIndex = currentDocument.paragraphs.findIndex(p => p.id === active.id);
      const newIndex = currentDocument.paragraphs.findIndex(p => p.id === (over ? over.id : null));
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderParagraphs(oldIndex, newIndex);
      }
    }
  };

  // If DnD Kit is not available, render without drag and drop
  if (!DndContext || !SortableContext) {
    return React.createElement(
      'div',
      { className: 'space-y-0' },
      currentDocument.paragraphs.map((paragraph, index) => 
        React.createElement(
          'div',
          { key: paragraph.id },
          // Add paragraph button before first paragraph
          index === 0 && React.createElement(
            'div',
            {
              className: 'relative h-4 group',
              style: { position: 'relative', height: '16px' },
              onMouseEnter: () => setHoveredIndex(-1),
              onMouseLeave: () => setHoveredIndex(null)
            },
            React.createElement(
              'div',
              {
                className: 'absolute inset-0 flex items-center cursor-text',
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'text'
                },
                onClick: () => addParagraph('', 0)
              },
              React.createElement('div', {
                className: window.cn(
                  'w-full h-px transition-all duration-200',
                  hoveredIndex === -1 ? 'bg-accent' : 'bg-transparent'
                ),
                style: {
                  width: '100%',
                  height: '1px',
                  transition: 'all 0.2s',
                  backgroundColor: hoveredIndex === -1 ? 'var(--primary)' : 'transparent'
                }
              })
            )
          ),
          
          React.createElement(window.ParagraphItem, {
            paragraph: paragraph,
            index: index
          }),
          
          // Add paragraph button after each paragraph
          React.createElement(
            'div',
            {
              className: 'relative h-4 group',
              style: { position: 'relative', height: '16px' },
              onMouseEnter: () => setHoveredIndex(index),
              onMouseLeave: () => setHoveredIndex(null)
            },
            React.createElement(
              'div',
              {
                className: 'absolute inset-0 flex items-center cursor-text',
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'text'
                },
                onClick: () => addParagraph('', index + 1)
              },
              React.createElement('div', {
                className: window.cn(
                  'w-full h-px transition-all duration-200',
                  hoveredIndex === index ? 'bg-accent' : 'bg-transparent'
                ),
                style: {
                  width: '100%',
                  height: '1px',
                  transition: 'all 0.2s',
                  backgroundColor: hoveredIndex === index ? 'var(--primary)' : 'transparent'
                }
              })
            )
          )
        )
      )
    );
  }

  // Render with full drag and drop support
  return React.createElement(
    DndContext,
    {
      sensors: sensors,
      collisionDetection: closestCenter,
      onDragEnd: handleDragEnd
    },
    React.createElement(
      SortableContext,
      {
        items: currentDocument.paragraphs.map(p => p.id),
        strategy: verticalListSortingStrategy
      },
      React.createElement(
        'div',
        { className: 'space-y-0' },
        currentDocument.paragraphs.map((paragraph, index) => 
          React.createElement(
            'div',
            { key: paragraph.id },
            // Add paragraph button before first paragraph
            index === 0 && React.createElement(
              'div',
              {
                className: 'relative h-4 group',
                style: { position: 'relative', height: '16px' },
                onMouseEnter: () => setHoveredIndex(-1),
                onMouseLeave: () => setHoveredIndex(null)
              },
              React.createElement(
                'div',
                {
                  className: 'absolute inset-0 flex items-center cursor-text',
                  style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'text'
                  },
                  onClick: () => addParagraph('', 0)
                },
                React.createElement('div', {
                  className: window.cn(
                    'w-full h-px transition-all duration-200',
                    hoveredIndex === -1 ? 'bg-accent' : 'bg-transparent'
                  ),
                  style: {
                    width: '100%',
                    height: '1px',
                    transition: 'all 0.2s',
                    backgroundColor: hoveredIndex === -1 ? 'var(--primary)' : 'transparent'
                  }
                })
              )
            ),
            
            React.createElement(window.ParagraphItem, {
              paragraph: paragraph,
              index: index
            }),
            
            // Add paragraph button after each paragraph
            React.createElement(
              'div',
              {
                className: 'relative h-4 group',
                style: { position: 'relative', height: '16px' },
                onMouseEnter: () => setHoveredIndex(index),
                onMouseLeave: () => setHoveredIndex(null)
              },
              React.createElement(
                'div',
                {
                  className: 'absolute inset-0 flex items-center cursor-text',
                  style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'text'
                  },
                  onClick: () => addParagraph('', index + 1)
                },
                React.createElement('div', {
                  className: window.cn(
                    'w-full h-px transition-all duration-200',
                    hoveredIndex === index ? 'bg-accent' : 'bg-transparent'
                  ),
                  style: {
                    width: '100%',
                    height: '1px',
                    transition: 'all 0.2s',
                    backgroundColor: hoveredIndex === index ? 'var(--primary)' : 'transparent'
                  }
                })
              )
            )
          )
        )
      )
    )
  );
}

// Make available globally
window.ParagraphList = ParagraphList;