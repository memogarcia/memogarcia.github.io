import { Document, ClipboardItem } from '../types';

const STORAGE_KEYS = {
  DOCUMENTS: 'writer_documents',
  CURRENT_DOCUMENT_ID: 'writer_current_document_id',
  CLIPBOARD: 'writer_clipboard',
  THEME: 'writer_theme',
};

// Check if we're running in the browser
const isClient = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage = {
  // Documents
  saveDocuments: (documents: Document[]) => {
    if (!isClient) return;
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  },
  
  loadDocuments: (): Document[] => {
    if (!isClient) return [];
    const stored = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!stored) return [];
    
    try {
      const documents = JSON.parse(stored);
      // Convert date strings back to Date objects
      return documents.map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
        paragraphs: doc.paragraphs.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })),
      }));
    } catch {
      return [];
    }
  },
  
  // Current Document ID
  saveCurrentDocumentId: (id: string | null) => {
    if (!isClient) return;
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_DOCUMENT_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_DOCUMENT_ID);
    }
  },
  
  loadCurrentDocumentId: (): string | null => {
    if (!isClient) return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_DOCUMENT_ID);
  },
  
  // Clipboard
  saveClipboard: (clipboard: ClipboardItem[]) => {
    if (!isClient) return;
    localStorage.setItem(STORAGE_KEYS.CLIPBOARD, JSON.stringify(clipboard));
  },
  
  loadClipboard: (): ClipboardItem[] => {
    if (!isClient) return [];
    const stored = localStorage.getItem(STORAGE_KEYS.CLIPBOARD);
    if (!stored) return [];
    
    try {
      const clipboard = JSON.parse(stored);
      return clipboard.map((item: any) => ({
        ...item,
        savedAt: new Date(item.savedAt),
      }));
    } catch {
      return [];
    }
  },
  
  // Clear all data
  clearAll: () => {
    if (!isClient) return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};