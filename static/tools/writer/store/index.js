/**
 * Writer Store - State Management
 * Converted from Zustand TypeScript to React Context + useState JavaScript
 * Provides centralized state management with localStorage persistence
 */

// Dependencies loaded via script tags

const { createContext, useContext, useState, useEffect, useRef } = React;

// Create WriterContext
const WriterContext = createContext(null);

/**
 * Load initial state from localStorage
 * @returns {Object} Initial state object
 */
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
  
  const documents = window.storage.loadDocuments();
  const currentDocumentId = window.storage.loadCurrentDocumentId();
  const currentDocument = documents.find(doc => doc.id === currentDocumentId) || null;
  const clipboard = window.storage.loadClipboard();
  
  // Load auth state (simplified - no actual auth in this version)
  const authData = localStorage.getItem('auth');
  const auth = authData ? JSON.parse(authData) : { isAuthenticated: true, userInfo: { name: 'User', email: 'user@local' } };
  
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

/**
 * Helper function to add history entry
 */
const addHistoryEntry = (state, action, description, previousValue, newValue) => {
  const entry = {
    id: window.uuidv4(),
    timestamp: new Date().toISOString(),
    action,
    documentId: state.currentDocument?.id || '',
    description,
    previousValue,
    newValue,
  };
  
  return [...state.history.slice(-99), entry]; // Keep last 100 entries
};

/**
 * WriterProvider Component
 * Provides state management context to the app
 */
function WriterProvider({ children }) {
  // Initialize state
  const initialState = loadInitialState();
  
  // Core state
  const [documents, setDocuments] = useState(initialState.documents);
  const [currentDocument, setCurrentDocument] = useState(initialState.currentDocument);
  const [clipboard, setClipboard] = useState(initialState.clipboard);
  const [history, setHistory] = useState([]);
  
  // UI state
  const [selectedParagraphId, setSelectedParagraphId] = useState(null);
  const [activeToolTab, setActiveToolTab] = useState('clipboard');
  const [globalPreviewMode, setGlobalPreviewMode] = useState(false);
  const [editorMode, setEditorMode] = useState('edit');
  const [searchTerm, setSearchTerm] = useState('');
  const [editorSettings, setEditorSettings] = useState(initialState.editorSettings);
  
  // Auth state (simplified)
  const [isAuthenticated] = useState(true);
  const [userInfo] = useState({ name: 'User', email: 'user@local' });
  const [isLoading, setIsLoading] = useState(false);

  // Document actions
  const createDocument = (title) => {
    const newDoc = {
      id: window.uuidv4(),
      title,
      paragraphs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      setDocuments(prev => [...prev, newDoc]);
      setCurrentDocument(newDoc);
      console.log('Document created:', title);
      return newDoc;
    } catch (error) {
      console.error('Failed to create document:', error);
      return null;
    }
  };

  const updateDocumentTitle = (rawTitle) => {
    if (!currentDocument) {
      console.error('No current document to update title');
      return;
    }

    // Validate and sanitize title
    const { isValid, sanitized: title, error } = window.validateTitle(rawTitle);
    if (!isValid) {
      console.error('Invalid title:', error);
      return;
    }

    try {
      const updatedDoc = {
        ...currentDocument,
        title,
        updatedAt: new Date(),
      };
      
      setCurrentDocument(updatedDoc);
      setDocuments(prev => prev.map(doc => 
        doc.id === updatedDoc.id ? updatedDoc : doc
      ));
      
      console.log('Document title updated:', title);
    } catch (error) {
      console.error('Failed to update document title:', error);
      throw error;
    }
  };

  const deleteDocument = (id) => {
    const docToDelete = documents.find(doc => doc.id === id);
    if (!docToDelete) {
      console.error('Document not found for deletion:', id);
      return;
    }

    try {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      if (currentDocument?.id === id) {
        setCurrentDocument(null);
      }
      console.log('Document deleted:', docToDelete.title);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  };

  const selectDocument = (id) => {
    const docToSelect = documents.find(doc => doc.id === id);
    if (!docToSelect) {
      console.error('Document not found for selection:', id);
      return;
    }

    try {
      setCurrentDocument(docToSelect);
      console.log('Document selected:', docToSelect.title);
    } catch (error) {
      console.error('Failed to select document:', error);
      throw error;
    }
  };

  const loadDocuments = async () => {
    // This was async in the original for API calls, keeping signature for compatibility
    try {
      setIsLoading(true);
      // Documents are already loaded in initialState, but refresh from storage
      const docs = window.storage.loadDocuments();
      setDocuments(docs);
      console.log('Documents loaded:', docs.length);
    } catch (error) {
      console.error('Failed to load documents:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Paragraph actions
  const addParagraphWithoutHistory = (rawContent, index) => {
    const { isValid, sanitized: content } = window.validateParagraph(rawContent);
    if (!isValid) {
      console.error('Invalid paragraph content');
      return;
    }

    const newParagraph = {
      id: window.uuidv4(),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (!currentDocument) return;
    
    const paragraphs = [...currentDocument.paragraphs];
    if (index !== undefined && index >= 0 && index <= paragraphs.length) {
      paragraphs.splice(index, 0, newParagraph);
    } else {
      paragraphs.push(newParagraph);
    }
    
    const updatedDoc = {
      ...currentDocument,
      paragraphs,
      updatedAt: new Date(),
    };
    
    setCurrentDocument(updatedDoc);
    setDocuments(prev => prev.map(doc =>
      doc.id === updatedDoc.id ? updatedDoc : doc
    ));
  };

  const addParagraph = (content, index) => {
    if (!currentDocument) {
      console.error('No current document to add paragraph to');
      return;
    }

    const newParagraph = {
      id: window.uuidv4(),
      content: content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      const paragraphs = [...currentDocument.paragraphs];
      const finalIndex = index !== undefined && index >= 0 && index <= paragraphs.length ? index : paragraphs.length;
      
      if (index !== undefined && index >= 0 && index <= paragraphs.length) {
        paragraphs.splice(index, 0, newParagraph);
      } else {
        paragraphs.push(newParagraph);
      }
      
      const updatedDoc = {
        ...currentDocument,
        paragraphs,
        updatedAt: new Date(),
      };
      
      setCurrentDocument(updatedDoc);
      setDocuments(prev => prev.map(doc =>
        doc.id === updatedDoc.id ? updatedDoc : doc
      ));
      
      console.log('Paragraph added at index:', finalIndex);
    } catch (error) {
      console.error('Failed to add paragraph:', error);
      throw error;
    }
  };

  const updateParagraph = (id, rawContent) => {
    if (!currentDocument) {
      console.error('No current document to update paragraph in');
      return;
    }

    const { isValid, sanitized: content } = window.validateParagraph(rawContent);
    if (!isValid) {
      console.error('Invalid paragraph content');
      return;
    }

    const oldParagraph = currentDocument.paragraphs.find(p => p.id === id);
    if (!oldParagraph) {
      console.error('Paragraph not found for update:', id);
      return;
    }

    try {
      const updatedDoc = {
        ...currentDocument,
        paragraphs: currentDocument.paragraphs.map(p =>
          p.id === id ? { ...p, content, updatedAt: new Date() } : p
        ),
        updatedAt: new Date(),
      };
      
      setCurrentDocument(updatedDoc);
      setDocuments(prev => prev.map(doc =>
        doc.id === updatedDoc.id ? updatedDoc : doc
      ));
      
      // Add to history
      setHistory(prev => addHistoryEntry(
        { currentDocument, history: prev }, 
        'paragraph_updated', 
        'Updated paragraph content', 
        oldParagraph.content, 
        content
      ));
      
      console.log('Paragraph updated:', id);
    } catch (error) {
      console.error('Failed to update paragraph:', error);
      throw error;
    }
  };

  const deleteParagraph = (id) => {
    if (!currentDocument) return;
    
    const deletedParagraph = currentDocument.paragraphs.find(p => p.id === id);
    if (!deletedParagraph) return;
    
    const updatedDoc = {
      ...currentDocument,
      paragraphs: currentDocument.paragraphs.filter(p => p.id !== id),
      updatedAt: new Date(),
    };
    
    setCurrentDocument(updatedDoc);
    setDocuments(prev => prev.map(doc =>
      doc.id === updatedDoc.id ? updatedDoc : doc
    ));

    console.log('Paragraph deleted:', id);
  };

  const addParagraphAfter = (content, afterId) => {
    if (!currentDocument) return '';
    
    const newParagraph = {
      id: window.uuidv4(),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const afterIndex = currentDocument.paragraphs.findIndex(p => p.id === afterId);
    if (afterIndex === -1) return newParagraph.id;
    
    const paragraphs = [...currentDocument.paragraphs];
    paragraphs.splice(afterIndex + 1, 0, newParagraph);
    
    const updatedDoc = {
      ...currentDocument,
      paragraphs,
      updatedAt: new Date(),
    };
    
    setCurrentDocument(updatedDoc);
    setDocuments(prev => prev.map(doc =>
      doc.id === updatedDoc.id ? updatedDoc : doc
    ));
    
    return newParagraph.id;
  };

  const reorderParagraphs = (fromIndex, toIndex) => {
    if (!currentDocument) return;
    
    const paragraphs = [...currentDocument.paragraphs];
    const [movedParagraph] = paragraphs.splice(fromIndex, 1);
    paragraphs.splice(toIndex, 0, movedParagraph);
    
    const updatedDoc = {
      ...currentDocument,
      paragraphs,
      updatedAt: new Date(),
    };
    
    setCurrentDocument(updatedDoc);
    setDocuments(prev => prev.map(doc =>
      doc.id === updatedDoc.id ? updatedDoc : doc
    ));
  };

  const replaceParagraphs = (contents) => {
    if (!currentDocument) return;
    
    const newParagraphs = contents.map(content => ({
      id: window.uuidv4(),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    const updatedDoc = {
      ...currentDocument,
      paragraphs: newParagraphs,
      updatedAt: new Date(),
    };
    
    setCurrentDocument(updatedDoc);
    setDocuments(prev => prev.map(doc =>
      doc.id === updatedDoc.id ? updatedDoc : doc
    ));
    
    setHistory(prev => addHistoryEntry(
      { currentDocument, history: prev },
      'paragraphs_replaced',
      `Replaced all paragraphs (${newParagraphs.length} new)`,
      currentDocument.paragraphs,
      newParagraphs
    ));
  };

  // Clipboard actions
  const addToClipboard = (content, note, sourceParagraphId, sourceDocumentId) => {
    const newItem = {
      id: window.uuidv4(),
      content,
      note,
      savedAt: new Date(),
      sourceParagraphId,
      sourceDocumentId,
    };
    
    try {
      setClipboard(prev => [newItem, ...prev]);
      console.log('Item added to clipboard');
    } catch (error) {
      console.error('Failed to add to clipboard:', error);
      throw error;
    }
  };

  const removeFromClipboard = (id) => {
    const itemToRemove = clipboard.find(item => item.id === id);
    if (!itemToRemove) {
      console.error('Clipboard item not found for removal:', id);
      return;
    }

    try {
      setClipboard(prev => prev.filter(item => item.id !== id));
      console.log('Item removed from clipboard');
    } catch (error) {
      console.error('Failed to remove from clipboard:', error);
      throw error;
    }
  };

  const restoreFromClipboard = (id, index) => {
    const item = clipboard.find(item => item.id === id);
    if (item) {
      addParagraph(item.content, index);
      removeFromClipboard(id);
    }
  };

  const updateClipboardNote = (id, note) => {
    setClipboard(prev => prev.map(item =>
      item.id === id ? { ...item, note } : item
    ));
  };

  // UI actions
  const setActiveToolTabWrapper = (tab) => {
    setActiveToolTab(tab);
  };

  const setGlobalPreviewModeWrapper = (enabled) => {
    setGlobalPreviewMode(enabled);
  };

  const setEditorModeWrapper = (mode) => {
    setEditorMode(mode);
    // Update globalPreviewMode for backwards compatibility
    setGlobalPreviewMode(mode === 'preview');
  };

  const updateEditorSettingsWrapper = (settings) => {
    const newSettings = { ...editorSettings, ...settings };
    localStorage.setItem('editorSettings', JSON.stringify(newSettings));
    setEditorSettings(newSettings);
  };

  const setSearchTermWrapper = (term) => {
    setSearchTerm(term);
  };

  const selectParagraph = (id) => {
    setSelectedParagraphId(id);
  };

  // Auth actions (simplified)
  const login = (userInfo) => {
    // Simplified - no actual authentication
    console.log('User logged in:', userInfo.name);
  };

  const logout = () => {
    // Simplified - no actual authentication
    console.log('User logged out');
  };

  // Create context value
  const contextValue = {
    // State
    currentDocument,
    documents,
    clipboard,
    history,
    selectedParagraphId,
    activeToolTab,
    globalPreviewMode,
    editorMode,
    editorSettings,
    searchTerm,
    isAuthenticated,
    userInfo,
    isLoading,

    // Document actions
    createDocument,
    updateDocumentTitle,
    deleteDocument,
    selectDocument,
    loadDocuments,

    // Paragraph actions
    addParagraph,
    addParagraphWithoutHistory,
    updateParagraph,
    deleteParagraph,
    addParagraphAfter,
    reorderParagraphs,
    selectParagraph,
    replaceParagraphs,

    // Clipboard actions
    addToClipboard,
    removeFromClipboard,
    restoreFromClipboard,
    updateClipboardNote,

    // UI actions
    setActiveToolTab: setActiveToolTabWrapper,
    setGlobalPreviewMode: setGlobalPreviewModeWrapper,
    setEditorMode: setEditorModeWrapper,
    updateEditorSettings: updateEditorSettingsWrapper,
    setSearchTerm: setSearchTermWrapper,

    // Auth actions
    login,
    logout,
  };

  // Setup debounced save functions
  const debouncedSaveDocuments = useRef(null);
  const debouncedSaveClipboard = useRef(null);

  useEffect(() => {
    if (!debouncedSaveDocuments.current) {
      debouncedSaveDocuments.current = window.debounce((docs) => {
        window.storage.saveDocuments(docs);
      }, 1000);
    }
    if (!debouncedSaveClipboard.current) {
      debouncedSaveClipboard.current = window.debounce((clip) => {
        window.storage.saveClipboard(clip);
      }, 500);
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (debouncedSaveDocuments.current) {
      debouncedSaveDocuments.current(documents);
    }
  }, [documents]);

  useEffect(() => {
    if (debouncedSaveClipboard.current) {
      debouncedSaveClipboard.current(clipboard);
    }
  }, [clipboard]);

  useEffect(() => {
    if (currentDocument?.id) {
      window.storage.saveCurrentDocumentId(currentDocument.id);
    } else {
      window.storage.saveCurrentDocumentId(null);
    }
  }, [currentDocument?.id]);

  // Cleanup on unmount
  useEffect(() => {
    const cleanup = () => {
      if (debouncedSaveDocuments.current?.flush) {
        debouncedSaveDocuments.current.flush();
      }
      if (debouncedSaveClipboard.current?.flush) {
        debouncedSaveClipboard.current.flush();
      }
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  return React.createElement(WriterContext.Provider, { value: contextValue }, children);
}

/**
 * Custom hook to use the Writer store
 * @returns {Object} Writer store context
 */
function useWriterStore() {
  const context = useContext(WriterContext);
  if (!context) {
    throw new Error('useWriterStore must be used within a WriterProvider');
  }
  return context;
}

// Export for backward compatibility with Zustand getState pattern
useWriterStore.getState = () => {
  // This is a simplified version - in real usage, the context would need to be available
  return {
    documents: [],
    currentDocument: null,
    // ... other default values
  };
};

// Make available globally
window.WriterProvider = WriterProvider;
window.useWriterStore = useWriterStore;