import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { validateTitle, validateParagraph } from '../utils/validation.js';
import { debounce } from '../utils/debounce.js';
import { storage } from '../utils/storage.js';

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
    isAuthenticated: false,
    userInfo: null,
    editorSettings,
  };
};

// Helper function to add history entry
const addHistoryEntry = (state, action, description, previousValue, newValue) => {
  const entry = {
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

export const useWriterStore = create((set, get) => ({
  // Initial state
  ...loadInitialState(),
  selectedParagraphId: null,
  activeToolTab: 'clipboard',
  globalPreviewMode: false,
  editorMode: 'edit',
  searchTerm: '',
  isLoading: false,
  error: null,
  
  // Document actions
  loadDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const documents = storage.loadDocuments();
      set({ documents, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createDocument: async (title) => {
    const validationResult = validateTitle(title);
    if (!validationResult.isValid) {
      return null;
    }

    const newDoc = {
      id: uuidv4(),
      title: validationResult.sanitized,
      paragraphs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      set(state => ({
        documents: [...state.documents, newDoc],
        currentDocument: newDoc,
      }));
      
      // Save to localStorage
      const newDocuments = [...get().documents];
      storage.saveDocuments(newDocuments);
      storage.saveCurrentDocumentId(newDoc.id);
      
      return newDoc;
    } catch (error) {
      console.error('Document creation failed:', error);
      return null;
    }
  },
  
  updateDocumentTitle: async (title) => {
    const currentDoc = get().currentDocument;
    if (!currentDoc) return;

    const validationResult = validateTitle(title);
    if (!validationResult.isValid) return;

    const sanitizedTitle = validationResult.sanitized;

    try {
      set(state => {
        if (!state.currentDocument) return state;
        const updatedDoc = {
          ...state.currentDocument,
          title: sanitizedTitle,
          updatedAt: new Date(),
        };
        
        const newDocuments = state.documents.map(doc =>
          doc.id === updatedDoc.id ? updatedDoc : doc
        );
        
        // Save to localStorage
        storage.saveDocuments(newDocuments);
        
        return {
          currentDocument: updatedDoc,
          documents: newDocuments,
        };
      });
    } catch (error) {
      console.error('Document title update failed:', error);
      throw error;
    }
  },
  
  deleteDocument: (id) => {
    try {
      set(state => {
        const newDocuments = state.documents.filter(doc => doc.id !== id);
        const newCurrentDocument = state.currentDocument?.id === id ? null : state.currentDocument;
        
        // Save to localStorage
        storage.saveDocuments(newDocuments);
        if (newCurrentDocument) {
          storage.saveCurrentDocumentId(newCurrentDocument.id);
        } else {
          storage.saveCurrentDocumentId(null);
        }
        
        return {
          documents: newDocuments,
          currentDocument: newCurrentDocument,
        };
      });
    } catch (error) {
      console.error('Document deletion failed:', error);
      throw error;
    }
  },
  
  selectDocument: (id) => {
    try {
      const docToSelect = get().documents.find(doc => doc.id === id);
      if (!docToSelect) return;

      set({ currentDocument: docToSelect });
      storage.saveCurrentDocumentId(id);
    } catch (error) {
      console.error('Document selection failed:', error);
      throw error;
    }
  },
  
  // Paragraph actions
  addParagraphWithoutHistory: (rawContent, index) => {
    const validationResult = validateParagraph(rawContent);
    if (!validationResult.isValid) return;

    const content = validationResult.sanitized;
    const newParagraph = {
      id: uuidv4(),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set(state => {
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
      
      const newDocuments = state.documents.map(doc =>
        doc.id === updatedDoc.id ? updatedDoc : doc
      );
      
      // Save to localStorage
      storage.saveDocuments(newDocuments);
      
      return {
        currentDocument: updatedDoc,
        documents: newDocuments,
      };
    });
  },
  
  addParagraph: (content, index) => {
    get().addParagraphWithoutHistory(content, index);
  },
  
  updateParagraph: (id, rawContent) => {
    const currentDoc = get().currentDocument;
    if (!currentDoc) return;

    const validationResult = validateParagraph(rawContent);
    if (!validationResult.isValid) return;

    const content = validationResult.sanitized;
    const oldParagraph = currentDoc.paragraphs.find(p => p.id === id);
    if (!oldParagraph) return;

    try {
      set(state => {
        if (!state.currentDocument) return state;
        
        const updatedDoc = {
          ...state.currentDocument,
          paragraphs: state.currentDocument.paragraphs.map(p =>
            p.id === id ? { ...p, content, updatedAt: new Date() } : p
          ),
          updatedAt: new Date(),
        };
        
        const newDocuments = state.documents.map(doc =>
          doc.id === updatedDoc.id ? updatedDoc : doc
        );
        
        // Save to localStorage
        storage.saveDocuments(newDocuments);
        
        return {
          currentDocument: updatedDoc,
          documents: newDocuments,
          ...addHistoryEntry(state, 'paragraph_updated', 'Updated paragraph content', oldParagraph.content, content),
        };
      });
    } catch (error) {
      console.error('Paragraph update failed:', error);
      throw error;
    }
  },
  
  deleteParagraph: (id) => {
    set(state => {
      if (!state.currentDocument) return state;
      
      const updatedDoc = {
        ...state.currentDocument,
        paragraphs: state.currentDocument.paragraphs.filter(p => p.id !== id),
        updatedAt: new Date(),
      };
      
      const newDocuments = state.documents.map(doc =>
        doc.id === updatedDoc.id ? updatedDoc : doc
      );
      
      // Save to localStorage
      storage.saveDocuments(newDocuments);
      
      return {
        currentDocument: updatedDoc,
        documents: newDocuments,
      };
    });
  },

  addParagraphAfter: (content, afterId) => {
    const { currentDocument } = get();
    if (!currentDocument) return '';

    const newParagraph = {
      id: uuidv4(),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const index = currentDocument.paragraphs.findIndex(p => p.id === afterId);
    const updatedParagraphs = [...currentDocument.paragraphs];
    updatedParagraphs.splice(index + 1, 0, newParagraph);

    set(state => ({
      currentDocument: state.currentDocument
        ? { ...state.currentDocument, paragraphs: updatedParagraphs }
        : null,
      documents: state.documents.map(doc =>
        doc.id === currentDocument.id
          ? { ...doc, paragraphs: updatedParagraphs }
          : doc
      ),
    }));

    // Save to localStorage
    const newDocuments = get().documents;
    storage.saveDocuments(newDocuments);

    return newParagraph.id;
  },

  reorderParagraphs: (fromIndex, toIndex) => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    const updatedParagraphs = [...currentDocument.paragraphs];
    const [removed] = updatedParagraphs.splice(fromIndex, 1);
    updatedParagraphs.splice(toIndex, 0, removed);

    set(state => ({
      currentDocument: state.currentDocument
        ? { ...state.currentDocument, paragraphs: updatedParagraphs }
        : null,
      documents: state.documents.map(doc =>
        doc.id === currentDocument.id
          ? { ...doc, paragraphs: updatedParagraphs }
          : doc
      ),
    }));

    // Save to localStorage
    const newDocuments = get().documents;
    storage.saveDocuments(newDocuments);
  },

  selectParagraph: (id) => {
    set({ selectedParagraphId: id });
  },

  replaceParagraphs: (contents) => {
    set(state => {
      if (!state.currentDocument) return state;
      
      const newParagraphs = contents.map(content => ({
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
      
      const newDocuments = state.documents.map(doc =>
        doc.id === updatedDoc.id ? updatedDoc : doc
      );
      
      // Save to localStorage
      storage.saveDocuments(newDocuments);
      
      return {
        currentDocument: updatedDoc,
        documents: newDocuments,
        ...addHistoryEntry(state, 'paragraphs_replaced', `Replaced all paragraphs (${newParagraphs.length} new)`, state.currentDocument.paragraphs, newParagraphs),
      };
    });
  },
  
  // Clipboard actions
  addToClipboard: (content, note, sourceParagraphId, sourceDocumentId) => {
    const newItem = {
      id: uuidv4(),
      content,
      note,
      savedAt: new Date(),
      sourceParagraphId,
      sourceDocumentId,
    };
    
    try {
      set(state => ({
        clipboard: [newItem, ...state.clipboard],
      }));
      
      // Save to localStorage
      const newClipboard = get().clipboard;
      storage.saveClipboard(newClipboard);
    } catch (error) {
      console.error('Clipboard addition failed:', error);
      throw error;
    }
  },
  
  removeFromClipboard: (id) => {
    try {
      set(state => ({
        clipboard: state.clipboard.filter(item => item.id !== id),
      }));
      
      // Save to localStorage
      const newClipboard = get().clipboard;
      storage.saveClipboard(newClipboard);
    } catch (error) {
      console.error('Clipboard removal failed:', error);
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
    set(state => ({
      clipboard: state.clipboard.map(item =>
        item.id === id ? { ...item, note } : item
      ),
    }));

    // Save to localStorage
    const newClipboard = get().clipboard;
    storage.saveClipboard(newClipboard);
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
    set(state => {
      const newSettings = { ...state.editorSettings, ...settings };
      localStorage.setItem('editorSettings', JSON.stringify(newSettings));
      return { editorSettings: newSettings };
    });
  },
  
  setSearchTerm: (term) => {
    set({ searchTerm: term });
  },
}));

// Create debounced save functions to prevent excessive localStorage writes
const debouncedSaveDocuments = debounce((documents) => {
  storage.saveDocuments(documents);
}, 1000); // Save documents after 1 second of inactivity

const debouncedSaveClipboard = debounce((clipboard) => {
  storage.saveClipboard(clipboard);
}, 500); // Save clipboard after 500ms of inactivity

// Subscribe to state changes with selective persistence
if (typeof window !== 'undefined') {
  let previousDocuments = [];
  let previousClipboard = [];
  let previousDocumentId = null;

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