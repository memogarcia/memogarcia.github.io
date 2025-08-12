import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { useWriterStore } from '../store';
import { smartSplitParagraphs } from '../utils/textParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { currentDocument, replaceParagraphs, addParagraph } = useWriterStore();
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.match(/\.(txt|md|markdown)$/i)) {
      setError('Please select a text or markdown file');
      return;
    }
    
    setFile(selectedFile);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(selectedFile);
  };
  
  const handleImport = () => {
    if (!text.trim() || !currentDocument) return;
    
    try {
      const paragraphs = smartSplitParagraphs(text);
      
      if (paragraphs.length === 0) {
        setError('No paragraphs found in the text');
        return;
      }
      
      if (importMode === 'replace') {
        replaceParagraphs(paragraphs);
      } else {
        paragraphs.forEach(content => {
          addParagraph(content);
        });
      }
      
      onClose();
      setText('');
      setFile(null);
      setError('');
    } catch (err) {
      setError('Failed to import text');
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-bg rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Import Text</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-hover rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload File (optional)
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 py-4 hover:bg-hover rounded-md transition-colors"
                >
                  {file ? (
                    <>
                      <FileText className="w-8 h-8 text-primary" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted">
                        {(file.size / 1024).toFixed(2)} KB
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted" />
                      <span className="text-sm text-muted">
                        Click to upload .txt or .md file
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Text Area */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Or paste text directly
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here. Paragraphs will be automatically detected based on double line breaks or other formatting."
                className="w-full h-48 px-3 py-2 bg-bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            
            {/* Import Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Import Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
                    className="text-primary"
                  />
                  <span className="text-sm">Append to existing paragraphs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
                    className="text-primary"
                  />
                  <span className="text-sm">Replace all paragraphs</span>
                </label>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            {/* Preview */}
            {text && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preview ({smartSplitParagraphs(text).length} paragraphs detected)
                </label>
                <div className="max-h-32 overflow-y-auto p-3 bg-bg-secondary border border-border rounded-md">
                  <div className="space-y-2">
                    {smartSplitParagraphs(text).slice(0, 3).map((para, idx) => (
                      <p key={idx} className="text-sm text-secondary">
                        {para.substring(0, 100)}
                        {para.length > 100 && '...'}
                      </p>
                    ))}
                    {smartSplitParagraphs(text).length > 3 && (
                      <p className="text-sm text-muted italic">
                        And {smartSplitParagraphs(text).length - 3} more paragraphs...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-secondary hover:bg-hover rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!text.trim() || !currentDocument}
            className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {smartSplitParagraphs(text).length} Paragraph{smartSplitParagraphs(text).length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}