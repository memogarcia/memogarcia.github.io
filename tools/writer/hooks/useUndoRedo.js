/**
 * Undo/Redo Hook - History management
 * Converted from TypeScript to JavaScript
 * Simplified to work with React Context instead of Zustand
 */

// Dependencies loaded via script tags

const { useEffect, useRef } = React;

const MAX_HISTORY_SIZE = 50;

/**
 * Custom hook for undo/redo functionality
 * Note: This is a simplified version that works with our React Context store
 * @returns {Object} Undo/redo functions and state
 */
function useUndoRedo() {
  const historyRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const isInternalUpdateRef = useRef(false);

  const { documents, currentDocument } = useWriterStore();

  // Save state to history
  const saveToHistory = () => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const newState = {
      documents: JSON.parse(JSON.stringify(documents)),
      currentDocument: currentDocument ? JSON.parse(JSON.stringify(currentDocument)) : null,
    };

    // Remove any states after current index
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);

    // Add new state
    historyRef.current.push(newState);

    // Limit history size
    if (historyRef.current.length > MAX_HISTORY_SIZE) {
      historyRef.current = historyRef.current.slice(-MAX_HISTORY_SIZE);
    }

    currentIndexRef.current = historyRef.current.length - 1;
  };

  // Undo action
  const undo = () => {
    // Note: This is a simplified implementation
    // In a full implementation, you'd restore state through the store
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      console.log('Undo action - history index:', currentIndexRef.current);
      
      // In the original implementation, this would restore state
      // For now, just log the action
      console.log('Undo functionality needs full integration with store');
    }
  };

  // Redo action
  const redo = () => {
    // Note: This is a simplified implementation
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      console.log('Redo action - history index:', currentIndexRef.current);
      
      // In the original implementation, this would restore state
      // For now, just log the action
      console.log('Redo functionality needs full integration with store');
    }
  };

  // Save state on changes
  useEffect(() => {
    saveToHistory();
  }, [documents, currentDocument]);

  return { 
    undo, 
    redo, 
    canUndo: currentIndexRef.current > 0, 
    canRedo: currentIndexRef.current < historyRef.current.length - 1 
  };
}

// Make available globally
window.useUndoRedo = useUndoRedo;