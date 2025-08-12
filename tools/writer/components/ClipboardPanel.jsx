const { useState } = React;

function ClipboardPanel() {
    const { clipboard, removeFromClipboard, addToClipboard } = useWriter();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClipboard = clipboard.filter(item =>
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const copyToSystemClipboard = async (content) => {
        try {
            await navigator.clipboard.writeText(content);
        } catch (err) {
            console.error('Failed to copy to system clipboard:', err);
            // Could show a toast notification here
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs < 1000 * 60) {
            return 'Just now';
        } else if (diffMs < 1000 * 60 * 60) {
            const minutes = Math.floor(diffMs / (1000 * 60));
            return `${minutes}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    const getSourceLabel = (source) => {
        switch (source) {
            case 'editor-selection':
                return '✂️ Selection';
            case 'editor-full':
                return '📄 Full Content';
            case 'manual':
                return '✋ Manual';
            default:
                return '📎 Clipboard';
        }
    };

    const truncateContent = (content, maxLength = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const clearAllClipboard = () => {
        if (confirm('Are you sure you want to clear all clipboard items?')) {
            clipboard.forEach(item => removeFromClipboard(item.id));
        }
    };

    return React.createElement(
        'div',
        { className: 'writer-clipboard' },
        
        React.createElement(
            'div',
            { className: 'clipboard-section' },
            React.createElement(
                'div',
                { 
                    style: { 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                    } 
                },
                React.createElement(
                    'h3',
                    { className: 'clipboard-section-title' },
                    `Clipboard (${filteredClipboard.length})`
                ),
                clipboard.length > 0 && React.createElement(
                    'button',
                    {
                        onClick: clearAllClipboard,
                        style: {
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            padding: '0.25rem'
                        },
                        title: 'Clear all clipboard items'
                    },
                    '🗑 Clear'
                )
            ),
            
            // Search input
            clipboard.length > 3 && React.createElement(
                'div',
                { style: { marginBottom: '1rem' } },
                React.createElement(
                    'input',
                    {
                        type: 'text',
                        value: searchTerm,
                        onChange: (e) => setSearchTerm(e.target.value),
                        placeholder: 'Search clipboard...',
                        style: {
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            background: 'var(--surface)',
                            color: 'var(--text-primary)',
                            fontSize: '0.8rem'
                        }
                    }
                )
            ),
            
            // Clipboard items
            filteredClipboard.length === 0 ? React.createElement(
                'div',
                { className: 'empty-state' },
                React.createElement('div', { className: 'empty-state-icon' }, '📋'),
                clipboard.length === 0 ? React.createElement(
                    React.Fragment,
                    null,
                    React.createElement('p', null, 'No clipboard items'),
                    React.createElement('p', { style: { fontSize: '0.75rem' } }, 'Copy text from the editor to build your clipboard')
                ) : React.createElement('p', null, 'No items match your search')
            ) : React.createElement(
                'div',
                { 
                    style: { 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        maxHeight: 'calc(100vh - 300px)',
                        overflowY: 'auto'
                    } 
                },
                filteredClipboard.map(item => React.createElement(
                    'div',
                    {
                        key: item.id,
                        className: 'clipboard-item'
                    },
                    
                    // Item content
                    React.createElement(
                        'div',
                        {
                            className: 'clipboard-item-content',
                            onClick: () => copyToSystemClipboard(item.content),
                            title: 'Click to copy to system clipboard'
                        },
                        truncateContent(item.content)
                    ),
                    
                    // Item metadata and actions
                    React.createElement(
                        'div',
                        { 
                            style: { 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '0.5rem'
                            } 
                        },
                        React.createElement(
                            'div',
                            { className: 'clipboard-item-meta' },
                            React.createElement('span', null, getSourceLabel(item.source)),
                            React.createElement('span', null, ' • '),
                            React.createElement('span', null, formatTime(item.createdAt)),
                            React.createElement('span', null, ' • '),
                            React.createElement('span', null, `${item.content.length} chars`)
                        ),
                        React.createElement(
                            'button',
                            {
                                onClick: (e) => {
                                    e.stopPropagation();
                                    removeFromClipboard(item.id);
                                },
                                style: {
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--danger)',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    padding: '0.25rem',
                                    borderRadius: 'var(--radius)'
                                },
                                title: 'Remove from clipboard'
                            },
                            '🗑'
                        )
                    )
                ))
            )
        ),
        
        // Quick actions section
        clipboard.length > 0 && React.createElement(
            'div',
            { className: 'clipboard-section' },
            React.createElement(
                'h3',
                { className: 'clipboard-section-title' },
                'Quick Actions'
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' } },
                React.createElement(
                    'button',
                    {
                        className: 'btn',
                        onClick: () => {
                            const allContent = clipboard
                                .map(item => item.content)
                                .join('\n\n---\n\n');
                            copyToSystemClipboard(allContent);
                        },
                        title: 'Copy all clipboard items as one document'
                    },
                    '📑 Copy All'
                ),
                React.createElement(
                    'button',
                    {
                        className: 'btn',
                        onClick: () => {
                            const exportData = {
                                exported: new Date().toISOString(),
                                items: clipboard
                            };
                            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                                type: 'application/json'
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `clipboard-export-${new Date().toISOString().split('T')[0]}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        },
                        title: 'Export clipboard as JSON file'
                    },
                    '💾 Export'
                )
            )
        )
    );
}

// Export for global access
window.ClipboardPanel = ClipboardPanel;