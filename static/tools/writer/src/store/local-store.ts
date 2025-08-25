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
      
      return newDoc;
    } catch (error) {
      console.error('Document creation failed:', error);
      return null;
    }
  },
  
  updateDocumentTitle: (rawTitle) => {
    const currentDoc = get().currentDocument;
    if (!currentDoc) {
      console.error('No current document to update title');
      return;
    }

    // Validate and sanitize title
    const { isValid, sanitized: title, error } = validateTitle(rawTitle);
    if (!isValid) {
      console.error('Document title validation failed:', error);
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
        
        // Title updated successfully
        
        return {
          currentDocument: updatedDoc,
          documents: state.documents.map(doc =>
            doc.id === updatedDoc.id ? updatedDoc : doc
          ),
        };
      });
    } catch (error) {
      console.error('Document title update failed:', error);
      throw error;
    }
  },
  
  deleteDocument: (id) => {
    const docToDelete = get().documents.find(doc => doc.id === id);
    if (!docToDelete) {
      console.error('Document not found for deletion:', id);
      return;
    }

    try {
      set((state) => ({
        documents: state.documents.filter(doc => doc.id !== id),
        currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
      }));
      
      // Document deleted successfully
    } catch (error) {
      console.error('Document deletion failed:', error);
      throw error;
    }
  },
  
  selectDocument: (id) => {
    const docToSelect = get().documents.find(doc => doc.id === id);
    if (!docToSelect) {
      console.error('Document not found for selection:', id);
      return;
    }

    try {
      set((state) => ({
        currentDocument: state.documents.find(doc => doc.id === id) || null,
      }));
      
      // Document selected successfully
    } catch (error) {
      console.error('Document selection failed:', error);
      throw error;
    }
  },
  
  // Paragraph actions
  addParagraphWithoutHistory: (rawContent, index) => {
    // Validate and sanitize content
    const { isValid, sanitized: content, error } = validateParagraph(rawContent);
    if (!isValid) {
      console.error('Paragraph validation failed:', error);
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
      console.error('No current document to add paragraph to');
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
        
        
        // Paragraph added successfully
        
        return {
          currentDocument: updatedDoc,
          documents: state.documents.map(doc =>
            doc.id === updatedDoc.id ? updatedDoc : doc
          ),
        };
      });
    } catch (error) {
      console.error('Paragraph addition failed:', error);
      throw error;
    }
  },
  
  updateParagraph: (id, rawContent) => {
    const currentDoc = get().currentDocument;
    if (!currentDoc) {
      console.error('No current document to update paragraph in');
      return;
    }

    // Validate and sanitize content
    const { isValid, sanitized: content, error } = validateParagraph(rawContent);
    if (!isValid) {
      console.error('Paragraph validation failed:', error);
      return;
    }

    const oldParagraph = currentDoc.paragraphs.find(p => p.id === id);
    if (!oldParagraph) {
      console.error('Paragraph not found for update:', id);
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
        
        
        // Paragraph updated successfully
        
        return {
          currentDocument: updatedDoc,
          documents: state.documents.map(doc =>
            doc.id === updatedDoc.id ? updatedDoc : doc
          ),
          ...addHistoryEntry(state, 'paragraph_updated', `Updated paragraph content`, oldParagraph.content, content),
        };
      });
    } catch (error) {
      console.error('Paragraph update failed:', error);
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
      
      // Clipboard item added successfully
    } catch (error) {
      console.error('Clipboard addition failed:', error);
      throw error;
    }
  },
  
  removeFromClipboard: (id) => {
    const itemToRemove = get().clipboard.find(item => item.id === id);
    if (!itemToRemove) {
      console.error('Clipboard item not found for removal:', id);
      return;
    }

    try {
      set((state) => ({
        clipboard: state.clipboard.filter(item => item.id !== id),
      }));
      
      // Clipboard item removed successfully
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