import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Document, Paragraph, ClipboardItem, EditorMode, EditorSettings } from '../types';
import { storage } from '../utils/storage';
import { validateTitle, validateParagraph } from '../utils/validation';
import { debounce } from '../utils/debounce';

interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  documentId: string;
  description?: string;
  previousValue?: any;
  newValue?: any;
}

interface WriterState {
  // Auth state
  isAuthenticated: boolean;
  userInfo: {
    email: string;
    name: string;
    picture: string;
  } | null;
  
  // Document state
  currentDocument: Document | null;
  documents: Document[];
  
  // Clipboard state
  clipboard: ClipboardItem[];
  
  // History state
  history: HistoryEntry[];
  
  // UI state
  selectedParagraphId: string | null;
  activeToolTab: 'clipboard' | 'toc' | 'settings' | 'history';
  globalPreviewMode: boolean;
  editorMode: EditorMode;
  editorSettings: EditorSettings;
  searchTerm: string;
  
  // Document actions
  createDocument: (title: string) => Document | null;
  updateDocumentTitle: (title: string) => void;
  deleteDocument: (id: string) => void;
  selectDocument: (id: string) => void;
  
  // Paragraph actions
  addParagraph: (content: string, index?: number) => void;
  addParagraphWithoutHistory: (content: string, index?: number) => void;
  updateParagraph: (id: string, content: string) => void;
  deleteParagraph: (id: string) => void;
  addParagraphAfter: (content: string, afterId: string) => string;
  reorderParagraphs: (fromIndex: number, toIndex: number) => void;
  selectParagraph: (id: string | null) => void;
  replaceParagraphs: (contents: string[]) => void;
  
  // Clipboard actions
  addToClipboard: (content: string, note?: string, sourceParagraphId?: string, sourceDocumentId?: string) => void;
  removeFromClipboard: (id: string) => void;
  restoreFromClipboard: (id: string, index?: number) => void;
  updateClipboardNote: (id: string, note: string) => void;
  
  
  // UI actions
  setActiveToolTab: (tab: 'clipboard' | 'toc' | 'settings') => void;
  setGlobalPreviewMode: (enabled: boolean) => void;
  setEditorMode: (mode: EditorMode) => void;
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  setSearchTerm: (term: string) => void;
  
  // Auth actions
  login: (userInfo: { email: string; name: string; picture: string }) => void;
  logout: () => void;
}

// Load initial state from localStorage
const loadInitialState = () => {
  // Only load from storage on the client side
  if (typeof window === 'undefined') {
    return {
      documents: [],
      currentDocument: null,
      clipboard: [],
      isAuthenticated: false,
      userInfo: null,
      editorSettings: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 16,
      },
    };
  }
  
  const documents = storage.loadDocuments();
  const currentDocumentId = storage.loadCurrentDocumentId();
  const currentDocument = documents.find(doc => doc.id === currentDocumentId) || null;
  const clipboard = storage.loadClipboard();
  
  // Load auth state
  const authData = localStorage.getItem('auth');
  const auth = authData ? JSON.parse(authData) : { isAuthenticated: false, userInfo: null };
  
  // Load editor settings
  const editorSettingsData = localStorage.getItem('editorSettings');
  const editorSettings = editorSettingsData ? JSON.parse(editorSettingsData) : {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 16,
  };
  
  return {
    documents,
    currentDocument,
    clipboard,
    history: [],
    isAuthenticated: auth.isAuthenticated,
    userInfo: auth.userInfo,
    editorSettings,
  };
};

// Helper function to add history entry
const addHistoryEntry = (state: WriterState, action: string, description?: string, previousValue?: any, newValue?: any) => {
  const entry: HistoryEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action,
    documentId: state.currentDocument?.id || '',
    description,
    previousValue,
    newValue,
  };
  
  return {
    history: [...state.history.slice(-99), entry], // Keep last 100 entries
  };
};

export const useWriterStore = create<WriterState>((set, get) => ({
  // Initial state
  ...loadInitialState(),
  history: [],
  selectedParagraphId: null,
  activeToolTab: 'clipboard',
  globalPreviewMode: false,
  editorMode: 'edit' as EditorMode,
  searchTerm: '',
  
  // Document actions
  createDocument: (title) => {
    const newDoc: Document = {
      id: uuidv4(),
      title,
      paragraphs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      set((state) => ({
        documents: [...state.documents, newDoc],
        currentDocument: newDoc,
      }));
      
      // Log the document creation
      logger.logDocument('document_created', newDoc, 'success');
      return newDoc;
    } catch (error) {
      logger.logError('document_creation_failed', {
        name: 'DocumentCreationError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, { title });
      return null;
    }
  },
  
  updateDocumentTitle: (rawTitle) => {
    const currentDoc = get().currentDocument;
    if (!currentDoc) {
      logger.logError('document_title_update_failed', {
        name: 'NoCurrentDocumentError',
        message: 'No current document to update title',
      }, { rawTitle });
      return;
    }

    // Validate and sanitize title
    const { isValid, sanitized: title, error } = validateTitle(rawTitle);
    if (!isValid) {
      logger.logError('document_title_validation_failed', {
        name: 'ValidationError',
        message: error || 'Invalid title',
      }, { rawTitle });
      return;
    }

    try {
      set((state) => {
        if (!state.currentDocument) return state;
        const updatedDoc = {
          ...state.currentDocument,
          title,
          updatedAt: new Date(),
        };
        
        // Log the title update
        logger.logDocument('document_updated', updatedDoc, 'success', {
          operation: { type: 'title_update', details: { oldTitle: currentDoc.title, newTitle: title } }
        });
        
        return {
          currentDocument: updatedDoc,
          documents: state.documents.map(doc =>
            doc.id === updatedDoc.id ? updatedDoc : doc
          ),
        };
      });
    } catch (error) {
      logger.logError('document_title_update_failed', {
        name: 'DocumentTitleUpdateError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, { title, documentId: currentDoc.id });
      throw error;
    }
  },
  
  deleteDocument: (id) => {
    const docToDelete = get().documents.find(doc => doc.id === id);
    if (!docToDelete) {
      logger.logError('document_deletion_failed', {
        name: 'DocumentNotFoundError',
        message: 'Document not found for deletion',
      }, { documentId: id });
      return;
    }

    try {
      set((state) => ({
        documents: state.documents.filter(doc => doc.id !== id),
        currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
      }));
      
      // Log the document deletion
      logger.logDocument('document_deleted', docToDelete, 'success');
    } catch (error) {
      logger.logError('document_deletion_failed', {
        name: 'DocumentDeletionError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, { documentId: id });
      throw error;
    }
  },
  
  selectDocument: (id) => {
    const docToSelect = get().documents.find(doc => doc.id === id);
    if (!docToSelect) {
      logger.logError('document_selection_failed', {
        name: 'DocumentNotFoundError',
        message: 'Document not found for selection',
      }, { documentId: id });
      return;
    }

    try {
      set((state) => ({
        currentDocument: state.documents.find(doc => doc.id === id) || null,
      }));
      
      // Log the document selection
      logger.logDocument('document_selected', docToSelect, 'success');
    } catch (error) {
      logger.logError('document_selection_failed', {
        name: 'DocumentSelectionError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, { documentId: id });
      throw error;
    }
  },
  
  // Paragraph actions
  addParagraphWithoutHistory: (rawContent, index) => {
    // Validate and sanitize content
    const { isValid, sanitized: content, error } = validateParagraph(rawContent);
    if (!isValid) {
      logger.logError('paragraph_validation_failed', {
        name: 'ValidationError',
        message: error || 'Invalid paragraph content',
      }, { rawContent });
      return;
    }

    const newParagraph: Paragraph = {
      id: uuidv4(),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => {
      if (!state.currentDocument) return state;
      
      const paragraphs = [...state.currentDocument.paragraphs];
      if (index !== undefined && index >= 0 && index <= paragraphs.length) {
        paragraphs.splice(index, 0, newParagraph);
      } else {
        paragraphs.push(newParagraph);
      }
      
      const updatedDoc = {
        ...state.currentDocument,
        paragraphs,
        updatedAt: new Date(),
      };
      
      return {
        currentDocument: updatedDoc,
        documents: state.documents.map(doc =>
          doc.id === updatedDoc.id ? updatedDoc : doc
        ),
      };
    });
  },
  
  addParagraph: (content, index) => {
    const currentDoc = get().currentDocument;
    if (!currentDoc) {
      logger.logError('paragraph_addition_failed', {
        name: 'NoCurrentDocumentError',
        message: 'No current document to add paragraph to',
      }, { content, index });
      return;
    }

    const newParagraph: Paragraph = {
      id: uuidv4(),
      content: content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      set((state) => {
        if (!state.currentDocument) return state;
        
        const paragraphs = [...state.currentDocument.paragraphs];
        const finalIndex = index !== undefined && index >= 0 && index <= paragraphs.length ? index : paragraphs.length;
        
        if (index !== undefined && index >= 0 && index <= paragraphs.length) {
          paragraphs.splice(index, 0, newParagraph);
        } else {
          paragraphs.push(newParagraph);
        }
        
        const updatedDoc = {
          ...state.currentDocument,
          paragraphs,
          updatedAt: new Date(),
        };
        
        
        // Log the paragraph addition
        logger.logParagraph('paragraph_added', {
          ...newParagraph,
          position: finalIndex,
        }, 'success', {
          changes: { after: content },
          attributes: { documentId: currentDoc.id },
        });
        
        return {
          currentDocument: updatedDoc,
          documents: state.documents.map(doc =>
            doc.id === updatedDoc.id ? updatedDoc : doc
          ),
        };
      });
    } catch (error) {
      logger.logError('paragraph_addition_failed', {
        name: 'ParagraphAdditionError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, { content, index, documentId: currentDoc.id });
      throw error;
    }
  },
  
  updateParagraph: (id, rawContent) => {
    const currentDoc = get().currentDocument;
    if (!currentDoc) {
      logger.logError('paragraph_update_failed', {
        name: 'NoCurrentDocumentError',
        message: 'No current document to update paragraph in',
      }, { paragraphId: id, rawContent });
      return;
    }

    // Validate and sanitize content
    const { isValid, sanitized: content, error } = validateParagraph(rawContent);
    if (!isValid) {
      logger.logError('paragraph_validation_failed', {
        name: 'ValidationError',
        message: error || 'Invalid paragraph content',
      }, { paragraphId: id, rawContent });
      return;
    }

    const oldParagraph = currentDoc.paragraphs.find(p => p.id === id);
    if (!oldParagraph) {
      logger.logError('paragraph_update_failed', {
        name: 'ParagraphNotFoundError',
        message: 'Paragraph not found for update',
      }, { paragraphId: id, content });
      return;
    }

    try {
      set((state) => {
        if (!state.currentDocument) return state;
        
        const updatedDoc = {
          ...state.currentDocument,
          paragraphs: state.currentDocument.paragraphs.map(p =>
            p.id === id ? { ...p, content, updatedAt: new Date() } : p
          ),
          updatedAt: new Date(),
        };
        
        
        // Log the paragraph update
        const position = state.currentDocument.paragraphs.findIndex(p => p.id === id);
        logger.logParagraph('paragraph_updated', {
          id,
          content,
          wordCount: content.split(/\s+/).filter(Boolean).length,
          characterCount: content.length,
          position,
          updatedAt: new Date().toISOString(),
        }, 'success', {
          changes: { before: oldParagraph.content, after: content },
          attributes: { documentId: currentDoc.id },
        });
        
        return {
          currentDocument: updatedDoc,
          documents: state.documents.map(doc =>
            doc.id === updatedDoc.id ? updatedDoc : doc
          ),
          ...addHistoryEntry(state, 'paragraph_updated', `Updated paragraph content`, oldParagraph.content, content),
        };
      });
    } catch (error) {
      logger.logError('paragraph_update_failed', {
        name: 'ParagraphUpdateError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, { paragraphId: id, content, documentId: currentDoc.id });
      throw error;
    }
  },
  
  deleteParagraph: (id) => {
    set((state) => {
      if (!state.currentDocument) return state;
      
      const deletedParagraph = state.currentDocument.paragraphs.find(p => p.id === id);
      if (!deletedParagraph) return state;
      
      const updatedDoc = {
        ...state.currentDocument,
        paragraphs: state.currentDocument.paragraphs.filter(p => p.id !== id),
        updatedAt: new Date(),
      };
      
      
      return {
        currentDocument: updatedDoc,
        documents: state.documents.map(doc =>
          doc.id === updatedDoc.id ? updatedDoc : doc
        ),
      };
    });
  },
  
  addParagraphAfter: (content, afterId) => {
    const newParagraph: Paragraph = {
      id: uuidv4(),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => {
      if (!state.currentDocument) return state;
      
      const afterIndex = state.currentDocument.paragraphs.findIndex(p => p.id === afterId);
      if (afterIndex === -1) return state;
      
      const paragraphs = [...state.currentDocument.paragraphs];
      paragraphs.splice(afterIndex + 1, 0, newParagraph);
      
      const updatedDoc = {
        ...state.currentDocument,
        paragraphs,
        updatedAt: new Date(),
      };
      
      
      return {
        currentDocument: updatedDoc,
        documents: state.documents.map(doc =>
          doc.id === updatedDoc.id ? updatedDoc : doc
        ),
      };
    });
    
    return newParagraph.id;
  },
  
  reorderParagraphs: (fromIndex, toIndex) => {
    set((state) => {
      if (!state.currentDocument) return state;
      
      const paragraphs = [...state.currentDocument.paragraphs];
      const [movedParagraph] = paragraphs.splice(fromIndex, 1);
      paragraphs.splice(toIndex, 0, movedParagraph);
      
      const updatedDoc = {
        ...state.currentDocument,
        paragraphs,
        updatedAt: new Date(),
      };
      
      return {
        currentDocument: updatedDoc,
        documents: state.documents.map(doc =>
          doc.id === updatedDoc.id ? updatedDoc : doc
        ),
      };
    });
  },
  
  selectParagraph: (id) => {
    set({ selectedParagraphId: id });
  },
  
  replaceParagraphs: (contents) => {
    set((state) => {
      if (!state.currentDocument) return state;
      
      const newParagraphs: Paragraph[] = contents.map(content => ({
        id: uuidv4(),
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      const updatedDoc = {
        ...state.currentDocument,
        paragraphs: newParagraphs,
        updatedAt: new Date(),
      };
      
      return {
        currentDocument: updatedDoc,
        documents: state.documents.map(doc =>
          doc.id === updatedDoc.id ? updatedDoc : doc
        ),
        ...addHistoryEntry(state, 'paragraphs_replaced', `Replaced all paragraphs (${newParagraphs.length} new)`, state.currentDocument.paragraphs, newParagraphs),
      };
    });
  },
  
  
  // Clipboard actions
  addToClipboard: (content, note, sourceParagraphId, sourceDocumentId) => {
    const newItem: ClipboardItem = {
      id: uuidv4(),
      content,
      note,
      savedAt: new Date(),
      sourceParagraphId,
      sourceDocumentId,
    };
    
    try {
      set((state) => ({
        clipboard: [newItem, ...state.clipboard],
      }));
      
      // Log the clipboard addition
      logger.logClipboard('clipboard_item_added', newItem, 'success');
    } catch (error) {
      logger.logError('clipboard_addition_failed', {
        name: 'ClipboardAdditionError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, { content, note });
      throw error;
    }
  },
  
  removeFromClipboard: (id) => {
    const itemToRemove = get().clipboard.find(item => item.id === id);
    if (!itemToRemove) {
      logger.logError('clipboard_removal_failed', {
        name: 'ClipboardItemNotFoundError',
        message: 'Clipboard item not found for removal',
      }, { clipboardItemId: id });
      return;
    }

    try {
      set((state) => ({
        clipboard: state.clipboard.filter(item => item.id !== id),
      }));
      
      // Log the clipboard removal
      logger.logClipboard('clipboard_item_removed', itemToRemove, 'success');
    } catch (error) {
      logger.logError('clipboard_removal_failed', {
        name: 'ClipboardRemovalError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, { clipboardItemId: id });
      throw error;
    }
  },
  
  restoreFromClipboard: (id, index) => {
    const state = get();
    const item = state.clipboard.find(item => item.id === id);
    if (item) {
      state.addParagraph(item.content, index);
      state.removeFromClipboard(id);
    }
  },
  
  updateClipboardNote: (id, note) => {
    set((state) => ({
      clipboard: state.clipboard.map(item =>
        item.id === id ? { ...item, note } : item
      ),
    }));
  },
  
  // UI actions
  setActiveToolTab: (tab) => {
    set({ activeToolTab: tab });
  },
  
  setGlobalPreviewMode: (enabled) => {
    set({ globalPreviewMode: enabled });
  },

  setEditorMode: (mode) => {
    set({ editorMode: mode });
    // Update globalPreviewMode for backwards compatibility
    set({ globalPreviewMode: mode === 'preview' });
  },
  
  updateEditorSettings: (settings) => {
    set((state) => {
      const newSettings = { ...state.editorSettings, ...settings };
      localStorage.setItem('editorSettings', JSON.stringify(newSettings));
      return { editorSettings: newSettings };
    });
  },
  
  setSearchTerm: (term) => {
    set({ searchTerm: term });
  },
  
  // Auth actions
  login: (userInfo) => {
    set({ isAuthenticated: true, userInfo });
    localStorage.setItem('auth', JSON.stringify({ isAuthenticated: true, userInfo }));
  },
  
  logout: () => {
    set({ isAuthenticated: false, userInfo: null });
    localStorage.removeItem('auth');
  },
}));

// Create debounced save functions to prevent excessive localStorage writes
const debouncedSaveDocuments = debounce((documents: Document[]) => {
  storage.saveDocuments(documents);
}, 1000); // Save documents after 1 second of inactivity

const debouncedSaveClipboard = debounce((clipboard: ClipboardItem[]) => {
  storage.saveClipboard(clipboard);
}, 500); // Save clipboard after 500ms of inactivity

// Subscribe to state changes with selective persistence
// Setup persistent storage subscription
if (typeof window !== 'undefined') {
  let previousDocuments: Document[] = [];
  let previousClipboard: ClipboardItem[] = [];
  let previousDocumentId: string | null = null;

  const unsubscribe = useWriterStore.subscribe((state) => {
    // Only save documents if they actually changed
    if (state.documents !== previousDocuments) {
      previousDocuments = state.documents;
      debouncedSaveDocuments(state.documents);
    }
    
    // Only save clipboard if it changed
    if (state.clipboard !== previousClipboard) {
      previousClipboard = state.clipboard;
      debouncedSaveClipboard(state.clipboard);
    }
    
    // Save current document ID immediately (it's small and important)
    const currentId = state.currentDocument?.id || null;
    if (currentId !== previousDocumentId) {
      previousDocumentId = currentId;
      storage.saveCurrentDocumentId(currentId);
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    unsubscribe();
    // Force save any pending changes
    debouncedSaveDocuments.flush?.();
    debouncedSaveClipboard.flush?.();
  });
}