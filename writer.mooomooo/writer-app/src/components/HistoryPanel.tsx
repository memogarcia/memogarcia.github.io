import { useState, useMemo } from 'react';
import { History, ChevronDown, ChevronUp, Plus, Minus, Edit } from 'lucide-react';
import { useWriterStore } from '../store';
import { format } from 'date-fns';

interface DiffLine {
  type: 'add' | 'remove' | 'unchanged';
  content: string;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];
  
  // Simple line-by-line diff
  const maxLength = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLength; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    
    if (oldLine === undefined && newLine !== undefined) {
      result.push({ type: 'add', content: newLine });
    } else if (oldLine !== undefined && newLine === undefined) {
      result.push({ type: 'remove', content: oldLine });
    } else if (oldLine !== newLine) {
      if (oldLine) result.push({ type: 'remove', content: oldLine });
      if (newLine) result.push({ type: 'add', content: newLine });
    } else {
      result.push({ type: 'unchanged', content: oldLine });
    }
  }
  
  return result;
}

export function HistoryPanel() {
  const { history, currentDocument } = useWriterStore();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Filter history for current document
  const documentHistory = useMemo(() => {
    if (!currentDocument) return [];
    return history
      .filter(entry => entry.documentId === currentDocument.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history, currentDocument]);
  
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };
  
  const getActionIcon = (action: string) => {
    if (action.includes('add') || action.includes('create')) return <Plus className="w-3 h-3" />;
    if (action.includes('delete') || action.includes('remove')) return <Minus className="w-3 h-3" />;
    return <Edit className="w-3 h-3" />;
  };
  
  const getActionColor = (action: string) => {
    if (action.includes('add') || action.includes('create')) return 'text-green-600 dark:text-green-400';
    if (action.includes('delete') || action.includes('remove')) return 'text-red-600 dark:text-red-400';
    return 'text-blue-600 dark:text-blue-400';
  };
  
  if (!currentDocument) {
    return (
      <div className="p-4 text-muted">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4" />
          <span className="font-medium">History</span>
        </div>
        <p className="text-sm">Select a document to view its history</p>
      </div>
    );
  }
  
  if (documentHistory.length === 0) {
    return (
      <div className="p-4 text-muted">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4" />
          <span className="font-medium">History</span>
        </div>
        <p className="text-sm">No history available for this document</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4" />
          <span className="font-medium">Document History</span>
          <span className="text-sm text-muted">({documentHistory.length} changes)</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {documentHistory.map((entry) => {
          const isExpanded = expandedItems.has(entry.id);
          const diff = entry.previousValue && entry.newValue 
            ? computeDiff(
                typeof entry.previousValue === 'string' ? entry.previousValue : JSON.stringify(entry.previousValue, null, 2),
                typeof entry.newValue === 'string' ? entry.newValue : JSON.stringify(entry.newValue, null, 2)
              )
            : [];
          
          return (
            <div key={entry.id} className="border-b border-border">
              <button
                onClick={() => toggleExpanded(entry.id)}
                className="w-full p-3 hover:bg-hover transition-colors text-left"
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-1 ${getActionColor(entry.action)}`}>
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {entry.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3 text-muted" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted" />
                      )}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                    </div>
                    {entry.description && (
                      <div className="text-sm text-secondary mt-1 truncate">
                        {entry.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>
              
              {isExpanded && diff.length > 0 && (
                <div className="p-3 bg-bg-secondary border-t border-border">
                  <div className="text-xs font-mono space-y-1 max-h-96 overflow-y-auto">
                    {diff.map((line, idx) => (
                      <div
                        key={idx}
                        className={`
                          ${line.type === 'add' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : ''}
                          ${line.type === 'remove' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' : ''}
                          ${line.type === 'unchanged' ? 'text-muted' : ''}
                          px-2 py-0.5 rounded
                        `}
                      >
                        <span className="select-none mr-2">
                          {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                        </span>
                        {line.content || '\u00A0'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}