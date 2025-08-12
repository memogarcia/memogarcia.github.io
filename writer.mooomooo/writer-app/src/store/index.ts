import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Document, Paragraph, ClipboardItem, EditorMode, EditorSettings } from '../types';
import { documentAPI } from '../services/api';
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
  isLoading: boolean;
  error: string | null;
  
  // Clipboard state (kept local for now)
  clipboard: ClipboardItem[];
  
  // History state (kept local for now)
  history: HistoryEntry[];
  
  // UI state
  selectedParagraphId: string | null;
  activeToolTab: 'clipboard' | 'toc' | 'settings' | 'history';
  globalPreviewMode: boolean;
  editorMode: EditorMode;
  editorSettings: EditorSettings;
  searchTerm: string;
  
  // Document actions
  loadDocuments: () => Promise<void>;
  createDocument: (title: string) => Promise<Document | null>;
  updateDocumentTitle: (title: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  selectDocument: (id: string) => Promise<void>;
  
  // Paragraph actions
  addParagraph: (content: string, index?: number) => Promise<void>;
  addParagraphWithoutHistory: (content: string, index?: number) => Promise<void>;
  updateParagraph: (id: string, content: string) => Promise<void>;
  deleteParagraph: (id: string) => Promise<void>;
  addParagraphAfter: (content: string, afterId: string) => Promise<string>;
  reorderParagraphs: (fromIndex: number, toIndex: number) => Promise<void>;
  selectParagraph: (id: string | null) => void;
  replaceParagraphs: (contents: string[]) => Promise<void>;
  
  // Clipboard actions (local)
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

// Debounced save function
const saveToBackend = debounce(async (documentId: string, updates: Partial<Document>) => {
  try {
    await documentAPI.update(documentId, updates);
  } catch (error) {
    console.error('Failed to save to backend:', error);
  }
}, 1000);

export const useWriterStore = create<WriterState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  userInfo: null,
  currentDocument: null,
  documents: [],
  isLoading: false,
  error: null,
  clipboard: [],
  history: [],
  selectedParagraphId: null,
  activeToolTab: 'clipboard',
  globalPreviewMode: false,
  editorMode: 'default',
  editorSettings: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 16,
  },
  searchTerm: '',

  // Document actions
  loadDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const documents = await documentAPI.list();
      set({ documents, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createDocument: async (title: string) => {
    const validationError = validateTitle(title);
    if (validationError) {
      return null;
    }

    set({ isLoading: true, error: null });
    try {
      const newDocument = await documentAPI.create(title);
      set(state => ({
        documents: [...state.documents, newDocument],
        currentDocument: newDocument,
        isLoading: false,
      }));
      return newDocument;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  updateDocumentTitle: async (title: string) => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    const validationError = validateTitle(title);
    if (validationError) {
      return;
    }

    set(state => ({
      currentDocument: state.currentDocument ? { ...state.currentDocument, title } : null,
      documents: state.documents.map(doc =>
        doc.id === currentDocument.id ? { ...doc, title } : doc
      ),
    }));

    // Save to backend
    saveToBackend(currentDocument.id, { title });
  },

  deleteDocument: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await documentAPI.delete(id);
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== id),
        currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  selectDocument: async (id: string) => {
    const { documents } = get();
    let document = documents.find(doc => doc.id === id);
    
    if (!document) return;

    // If document doesn't have paragraphs loaded, fetch from backend
    if (!document.paragraphs || document.paragraphs.length === 0) {
      set({ isLoading: true });
      try {
        document = await documentAPI.get(id);
        set(state => ({
          documents: state.documents.map(doc =>
            doc.id === id ? document! : doc
          ),
        }));
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return;
      }
    }

    set({ currentDocument: document, isLoading: false });
  },

  // Paragraph actions
  addParagraph: async (content: string, index?: number) => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    const validationError = validateParagraph(content);
    if (validationError) {
      return;
    }

    const newParagraph: Paragraph = {
      id: uuidv4(),
      content,
      isEditing: false,
    };

    const updatedParagraphs = [...currentDocument.paragraphs];
    if (index !== undefined) {
      updatedParagraphs.splice(index, 0, newParagraph);
    } else {
      updatedParagraphs.push(newParagraph);
    }

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

    // Save to backend
    saveToBackend(currentDocument.id, { paragraphs: updatedParagraphs });
  },

  addParagraphWithoutHistory: async (content: string, index?: number) => {
    // Same as addParagraph for now but await it properly
    await get().addParagraph(content, index);
  },

  updateParagraph: async (id: string, content: string) => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    const validationError = validateParagraph(content);
    if (validationError) {
      return;
    }

    const updatedParagraphs = currentDocument.paragraphs.map(p =>
      p.id === id ? { ...p, content } : p
    );

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

    // Save to backend
    saveToBackend(currentDocument.id, { paragraphs: updatedParagraphs });
  },

  deleteParagraph: async (id: string) => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    const updatedParagraphs = currentDocument.paragraphs.filter(p => p.id !== id);

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

    // Save to backend
    saveToBackend(currentDocument.id, { paragraphs: updatedParagraphs });
  },

  addParagraphAfter: async (content: string, afterId: string) => {
    const { currentDocument } = get();
    if (!currentDocument) return '';

    const newParagraph: Paragraph = {
      id: uuidv4(),
      content,
      isEditing: false,
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

    // Save to backend
    saveToBackend(currentDocument.id, { paragraphs: updatedParagraphs });

    return newParagraph.id;
  },

  reorderParagraphs: async (fromIndex: number, toIndex: number) => {
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

    // Save to backend
    saveToBackend(currentDocument.id, { paragraphs: updatedParagraphs });
  },

  selectParagraph: (id: string | null) => {
    set({ selectedParagraphId: id });
  },

  replaceParagraphs: async (contents: string[]) => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    const newParagraphs: Paragraph[] = contents.map(content => ({
      id: uuidv4(),
      content,
      isEditing: false,
    }));

    set(state => ({
      currentDocument: state.currentDocument
        ? { ...state.currentDocument, paragraphs: newParagraphs }
        : null,
      documents: state.documents.map(doc =>
        doc.id === currentDocument.id
          ? { ...doc, paragraphs: newParagraphs }
          : doc
      ),
    }));

    // Save to backend
    saveToBackend(currentDocument.id, { paragraphs: newParagraphs });
  },

  // Clipboard actions (kept local for now)
  addToClipboard: (content: string, note?: string, sourceParagraphId?: string, sourceDocumentId?: string) => {
    const newItem: ClipboardItem = {
      id: uuidv4(),
      content,
      note,
      timestamp: new Date().toISOString(),
      sourceParagraphId,
      sourceDocumentId,
    };

    set(state => ({
      clipboard: [newItem, ...state.clipboard],
    }));

    // Store clipboard locally
    if (typeof window !== 'undefined') {
      localStorage.setItem('writer-clipboard', JSON.stringify([newItem, ...get().clipboard]));
    }
  },

  removeFromClipboard: (id: string) => {
    set(state => ({
      clipboard: state.clipboard.filter(item => item.id !== id),
    }));

    // Update local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('writer-clipboard', JSON.stringify(get().clipboard));
    }
  },

  restoreFromClipboard: (id: string, index?: number) => {
    const { clipboard } = get();
    const item = clipboard.find(i => i.id === id);
    if (!item) return;

    get().addParagraph(item.content, index);
  },

  updateClipboardNote: (id: string, note: string) => {
    set(state => ({
      clipboard: state.clipboard.map(item =>
        item.id === id ? { ...item, note } : item
      ),
    }));

    // Update local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('writer-clipboard', JSON.stringify(get().clipboard));
    }
  },

  // UI actions
  setActiveToolTab: (tab: 'clipboard' | 'toc' | 'settings') => {
    set({ activeToolTab: tab });
  },

  setGlobalPreviewMode: (enabled: boolean) => {
    set({ globalPreviewMode: enabled });
  },

  setEditorMode: (mode: EditorMode) => {
    set({ editorMode: mode });
  },

  updateEditorSettings: (settings: Partial<EditorSettings>) => {
    set(state => ({
      editorSettings: { ...state.editorSettings, ...settings },
    }));
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  // Auth actions
  login: (userInfo: { email: string; name: string; picture: string }) => {
    set({ isAuthenticated: true, userInfo });
  },

  logout: () => {
    set({ isAuthenticated: false, userInfo: null });
  },
}));