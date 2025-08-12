// localStorage utilities
export const storage = {
  saveDocuments(documents) {
    try {
      localStorage.setItem('writer-documents', JSON.stringify(documents));
    } catch (error) {
      console.error('Failed to save documents:', error);
    }
  },

  loadDocuments() {
    try {
      const saved = localStorage.getItem('writer-documents');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load documents:', error);
      return [];
    }
  },

  saveCurrentDocumentId(id) {
    try {
      localStorage.setItem('writer-current-document', id || '');
    } catch (error) {
      console.error('Failed to save current document ID:', error);
    }
  },

  loadCurrentDocumentId() {
    try {
      return localStorage.getItem('writer-current-document');
    } catch (error) {
      console.error('Failed to load current document ID:', error);
      return null;
    }
  },

  saveClipboard(clipboard) {
    try {
      localStorage.setItem('writer-clipboard', JSON.stringify(clipboard));
    } catch (error) {
      console.error('Failed to save clipboard:', error);
    }
  },

  loadClipboard() {
    try {
      const saved = localStorage.getItem('writer-clipboard');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load clipboard:', error);
      return [];
    }
  }
};