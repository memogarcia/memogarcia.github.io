import React, { useState, useEffect, useRef } from 'react';

export function ResizeHandle({ side, onResize }) {
  const [isResizing, setIsResizing] = useState(false);
  const lastXRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const delta = side === 'left' ? e.clientX - lastXRef.current : lastXRef.current - e.clientX;
      lastXRef.current = e.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, side, onResize]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    lastXRef.current = e.clientX;
  };

  return (
    <div
      className={`absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent transition-colors z-10 ${
        side === 'left' ? 'right-0' : 'left-0'
      }`}
      onMouseDown={handleMouseDown}
      style={{ width: '4px', marginLeft: side === 'right' ? '-2px' : '0', marginRight: side === 'left' ? '-2px' : '0' }}
    />
  );
}