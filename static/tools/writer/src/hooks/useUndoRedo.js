import { useCallback } from 'react';
import { useWriterStore } from '../store/index.js';

export function useUndoRedo() {
  // Simplified undo/redo - in a full implementation this would maintain
  // a history stack and allow reverting to previous states
  const undo = useCallback(() => {
    console.log('Undo - not implemented yet');
    // TODO: Implement proper undo functionality
  }, []);

  const redo = useCallback(() => {
    console.log('Redo - not implemented yet');  
    // TODO: Implement proper redo functionality
  }, []);

  return { undo, redo };
}