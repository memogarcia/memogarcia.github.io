import { useRef, useEffect } from 'react';
import { cn } from '../utils/cn';

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  side: 'left' | 'right';
  className?: string;
}

export function ResizeHandle({ onResize, side, className }: ResizeHandleProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const delta = side === 'left' 
        ? e.clientX - startX.current
        : startX.current - e.clientX;
      
      onResize(delta);
      startX.current = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-resize-handle]')) {
        isDragging.current = true;
        startX.current = e.clientX;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize, side]);

  return (
    <div
      data-resize-handle
      className={cn(
        "absolute top-0 bottom-0 w-1 hover:w-2 cursor-col-resize transition-all group",
        side === 'left' ? 'right-0' : 'left-0',
        className
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-border opacity-0 group-hover:opacity-100 transition-opacity",
        "hover:bg-accent"
      )} />
    </div>
  );
}