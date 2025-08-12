import { useEffect, useState } from 'react';
import { useWriterStore } from '../store/local-store';
import { ParagraphItem } from './ParagraphItem';
import { cn } from '../utils/cn';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function ParagraphList() {
  const { currentDocument, reorderParagraphs, editorMode, selectedParagraphId, selectParagraph, addParagraph } = useWriterStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-select first paragraph in focus mode if none selected
  useEffect(() => {
    if (editorMode === 'focus' && !selectedParagraphId && currentDocument?.paragraphs && currentDocument.paragraphs.length > 0) {
      selectParagraph(currentDocument.paragraphs[0].id);
    }
  }, [editorMode]); // Only run when editorMode changes

  if (!currentDocument || currentDocument.paragraphs.length === 0) {
    return (
      <div 
        className="text-center py-16 text-muted cursor-text min-h-[400px] flex items-center justify-center"
        onClick={() => {
          // Create first paragraph when clicking on empty document
          addParagraph('');
        }}
      >
        <div>
          <p className="text-lg mb-2">Your document is empty</p>
          <p className="text-sm">Click anywhere to start writing</p>
        </div>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = currentDocument.paragraphs.findIndex(p => p.id === active.id);
      const newIndex = currentDocument.paragraphs.findIndex(p => p.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderParagraphs(oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={currentDocument.paragraphs.map(p => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0">
          {currentDocument.paragraphs.map((paragraph, index) => (
            <div key={paragraph.id}>
              {/* Add paragraph button before first paragraph */}
              {index === 0 && (
                <div 
                  className="relative h-2 group"
                  onMouseEnter={() => setHoveredIndex(-1)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div 
                    className="absolute inset-0 flex items-center cursor-text"
                    onClick={() => addParagraph('', 0)}
                  >
                    <div className={cn(
                      "w-full h-px transition-all duration-200",
                      hoveredIndex === -1 ? "bg-accent" : "bg-transparent"
                    )} />
                  </div>
                </div>
              )}
              
              <ParagraphItem
                paragraph={paragraph}
                index={index}
              />
              
              {/* Add paragraph button after each paragraph */}
              <div 
                className="relative h-2 group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div 
                  className="absolute inset-0 flex items-center cursor-text"
                  onClick={() => addParagraph('', index + 1)}
                >
                  <div className={cn(
                    "w-full h-px transition-all duration-200",
                    hoveredIndex === index ? "bg-accent" : "bg-transparent"
                  )} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}