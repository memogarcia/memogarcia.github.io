import { useWriterStore } from './index';

/**
 * Optimized selectors for the writer store to prevent unnecessary re-renders
 * Use these instead of directly accessing the store to improve performance
 */

// Document selectors
export const useCurrentDocument = () => 
  useWriterStore(state => state.currentDocument);

export const useDocuments = () => 
  useWriterStore(state => state.documents);

export const useDocumentActions = () => 
  useWriterStore(
    state => ({
      createDocument: state.createDocument,
      updateDocumentTitle: state.updateDocumentTitle,
      deleteDocument: state.deleteDocument,
      selectDocument: state.selectDocument,
    })
  );

// Paragraph selectors
export const useParagraphs = () => 
  useWriterStore(state => state.currentDocument?.paragraphs || []);

export const useParagraphActions = () => 
  useWriterStore(
    state => ({
      addParagraph: state.addParagraph,
      updateParagraph: state.updateParagraph,
      deleteParagraph: state.deleteParagraph,
      reorderParagraphs: state.reorderParagraphs,
      addParagraphAfter: state.addParagraphAfter,
    })
  );

// UI selectors
export const useEditorMode = () => 
  useWriterStore(state => state.editorMode);

export const useSelectedParagraphId = () => 
  useWriterStore(state => state.selectedParagraphId);

export const useUIActions = () => 
  useWriterStore(
    state => ({
      selectParagraph: state.selectParagraph,
      setEditorMode: state.setEditorMode,
      setActiveToolTab: state.setActiveToolTab,
      setGlobalPreviewMode: state.setGlobalPreviewMode,
    })
  );

// Clipboard selectors
export const useClipboard = () => 
  useWriterStore(state => state.clipboard);

export const useClipboardActions = () => 
  useWriterStore(
    state => ({
      addToClipboard: state.addToClipboard,
      removeFromClipboard: state.removeFromClipboard,
      restoreFromClipboard: state.restoreFromClipboard,
      updateClipboardNote: state.updateClipboardNote,
    })
  );

// Settings selectors
export const useEditorSettings = () => 
  useWriterStore(state => state.editorSettings);

export const useUpdateEditorSettings = () => 
  useWriterStore(state => state.updateEditorSettings);

// Auth selectors
export const useAuth = () => 
  useWriterStore(
    state => ({
      isAuthenticated: state.isAuthenticated,
      userInfo: state.userInfo,
      login: state.login,
      logout: state.logout,
    })
  );