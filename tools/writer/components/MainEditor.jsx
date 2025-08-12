const { useState, useEffect, useRef } = React;

function MainEditor() {
    const { 
        getActiveProject, 
        updateContent, 
        addToClipboard,
        activeProjectId 
    } = useWriter();
    
    const [content, setContent] = useState('');
    const [lastSaved, setLastSaved] = useState(null);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const textareaRef = useRef(null);
    
    const activeProject = getActiveProject();

    // Load content when active project changes
    useEffect(() => {
        if (activeProject) {
            setContent(activeProject.content || '');
        } else {
            setContent('');
        }
    }, [activeProject]);

    // Update word and character counts
    useEffect(() => {
        setCharCount(content.length);
        setWordCount(content.trim() === '' ? 0 : content.trim().split(/\s+/).length);
    }, [content]);

    // Auto-save functionality
    useEffect(() => {
        if (!activeProjectId || !activeProject) return;

        const saveTimeout = setTimeout(() => {
            if (content !== activeProject.content) {
                updateContent(activeProjectId, content);
                setLastSaved(new Date());
            }
        }, 1000); // Save 1 second after stopping typing

        return () => clearTimeout(saveTimeout);
    }, [content, activeProjectId, activeProject, updateContent]);

    const handleContentChange = (e) => {
        setContent(e.target.value);
    };

    const handleKeyDown = (e) => {
        // Handle Tab key for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newContent = content.substring(0, start) + '\t' + content.substring(end);
            setContent(newContent);
            
            // Restore cursor position
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 1;
            }, 0);
        }

        // Save with Ctrl+S (Cmd+S on Mac)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (activeProjectId && content !== activeProject?.content) {
                updateContent(activeProjectId, content);
                setLastSaved(new Date());
            }
        }
    };

    const handleSelection = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
        if (selectedText.trim().length > 0) {
            return selectedText;
        }
        return null;
    };

    const copyToClipboard = async () => {
        const selectedText = handleSelection();
        if (selectedText) {
            try {
                await navigator.clipboard.writeText(selectedText);
                addToClipboard(selectedText, 'editor-selection');
            } catch (err) {
                // Fallback for older browsers
                addToClipboard(selectedText, 'editor-selection');
            }
        } else if (content.trim()) {
            try {
                await navigator.clipboard.writeText(content);
                addToClipboard(content, 'editor-full');
            } catch (err) {
                addToClipboard(content, 'editor-full');
            }
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!activeProject) {
        return React.createElement(
            'div',
            { className: 'writer-editor' },
            React.createElement(
                'div',
                { className: 'empty-state' },
                React.createElement('div', { className: 'empty-state-icon' }, '✍️'),
                React.createElement('h3', null, 'No Project Selected'),
                React.createElement('p', null, 'Select a project from the sidebar or create a new one to start writing.'),
                React.createElement('p', { style: { fontSize: '0.8rem', color: 'var(--text-tertiary)' } }, 'Your writing will be automatically saved as you type.')
            )
        );
    }

    return React.createElement(
        'div',
        { className: 'writer-editor' },
        
        // Editor toolbar
        React.createElement(
            'div',
            { className: 'editor-toolbar' },
            
            // Stats
            React.createElement(
                'div',
                { style: { display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' } },
                React.createElement('span', null, `${wordCount} words`),
                React.createElement('span', null, `${charCount} characters`),
                lastSaved && React.createElement('span', null, `Saved at ${formatTime(lastSaved)}`)
            ),
            
            // Actions
            React.createElement(
                'div',
                { style: { display: 'flex', gap: '0.5rem', marginLeft: 'auto' } },
                React.createElement(
                    'button',
                    {
                        className: 'toolbar-btn',
                        onClick: copyToClipboard,
                        title: 'Copy selection or full content to clipboard'
                    },
                    '📋 Copy'
                ),
                React.createElement(
                    'button',
                    {
                        className: 'toolbar-btn',
                        onClick: () => {
                            if (activeProjectId && content !== activeProject?.content) {
                                updateContent(activeProjectId, content);
                                setLastSaved(new Date());
                            }
                        },
                        title: 'Save now (Ctrl+S)'
                    },
                    '💾 Save'
                )
            )
        ),
        
        // Main editor
        React.createElement(
            'div',
            { className: 'editor-content' },
            React.createElement(
                'textarea',
                {
                    ref: textareaRef,
                    className: 'editor-textarea',
                    value: content,
                    onChange: handleContentChange,
                    onKeyDown: handleKeyDown,
                    placeholder: `Start writing in "${activeProject.title}"...\n\nTips:\n• Press Tab for indentation\n• Ctrl+S to save manually\n• Select text and click Copy to add to clipboard\n• Your work is automatically saved as you type`,
                    spellCheck: true,
                    style: {
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.95rem',
                        lineHeight: '1.6'
                    }
                }
            )
        )
    );
}

// Export for global access
window.MainEditor = MainEditor;