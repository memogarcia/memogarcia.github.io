import { useEffect, useRef } from 'react';
import { useWriterStore } from '../store';

interface HistoryState {
  documents: ReturnType<typeof useWriterStore.getState>['documents'];
  currentDocument: ReturnType<typeof useWriterStore.getState>['currentDocument'];
}

const MAX_HISTORY_SIZE = 50;

export function useUndoRedo() {
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef(-1);
  const isInternalUpdateRef = useRef(false);

  const { documents, currentDocument } = useWriterStore();

  // Save state to history
  const saveToHistory = () => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const newState: HistoryState = {
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
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const previousState = historyRef.current[currentIndexRef.current];
      
      isInternalUpdateRef.current = true;
      
      // Restore state using proper setState
      useWriterStore.setState({
        documents: previousState.documents,
        currentDocument: previousState.currentDocument,
      });
    }
  };

  // Redo action
  const redo = () => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      const nextState = historyRef.current[currentIndexRef.current];
      
      isInternalUpdateRef.current = true;
      
      // Restore state using proper setState
      useWriterStore.setState({
        documents: nextState.documents,
        currentDocument: nextState.currentDocument,
      });
    }
  };

  // Save state on changes
  useEffect(() => {
    saveToHistory();
  }, [documents, currentDocument]);


  return { undo, redo, canUndo: currentIndexRef.current > 0, canRedo: currentIndexRef.current < historyRef.current.length - 1 };
}