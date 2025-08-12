import { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useWriterStore } from '../store';
import { ParagraphItem } from './ParagraphItem';
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

interface VirtualizedParagraphListProps {
  height: number;
}

const ITEM_HEIGHT = 250; // Increased height to prevent overlap

const Row = memo(({ index, style, data }: any) => {
  const paragraph = data[index];
  return (
    <div style={{
      ...style,
      paddingBottom: '8px',
      boxSizing: 'border-box'
    }}>
      <ParagraphItem
        key={paragraph.id}
        paragraph={paragraph}
        index={index}
      />
    </div>
  );
});

Row.displayName = 'Row';

export function VirtualizedParagraphList({ height }: VirtualizedParagraphListProps) {
  const { currentDocument, reorderParagraphs } = useWriterStore();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!currentDocument || currentDocument.paragraphs.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="text-lg mb-2">Your document is empty</p>
        <p className="text-sm">Start writing by adding your first paragraph below</p>
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

  // For large documents, use virtualization
  if (currentDocument.paragraphs.length > 50) {
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
          <List
            height={height}
            itemCount={currentDocument.paragraphs.length}
            itemSize={ITEM_HEIGHT}
            width="100%"
            itemData={currentDocument.paragraphs}
            overscanCount={3}
            style={{ overflow: 'auto' }}
          >
            {Row}
          </List>
        </SortableContext>
      </DndContext>
    );
  }

  // For smaller documents, render normally
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
        <div className="space-y-2">
          {currentDocument.paragraphs.map((paragraph, index) => (
            <ParagraphItem
              key={paragraph.id}
              paragraph={paragraph}
              index={index}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}