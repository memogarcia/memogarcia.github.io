const { useState } = React;

function Header() {
    const { getActiveProject, addProject } = useWriter();
    const [showNewProjectInput, setShowNewProjectInput] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');

    const activeProject = getActiveProject();

    const handleNewProject = () => {
        if (newProjectTitle.trim()) {
            addProject(newProjectTitle.trim());
            setNewProjectTitle('');
            setShowNewProjectInput(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleNewProject();
        } else if (e.key === 'Escape') {
            setNewProjectTitle('');
            setShowNewProjectInput(false);
        }
    };

    return React.createElement(
        'div',
        { className: 'writer-header' },
        
        // Left section - Back link
        React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '1rem' } },
            React.createElement(
                'a',
                {
                    href: '/tools/',
                    className: 'back-link'
                },
                '← Back to Tools'
            )
        ),

        // Center section - Title and current project
        React.createElement(
            'div',
            { style: { textAlign: 'center' } },
            React.createElement(
                'h1',
                { className: 'writer-title' },
                'Writer'
            ),
            activeProject && React.createElement(
                'p',
                { className: 'writer-subtitle' },
                activeProject.title
            )
        ),

        // Right section - New project button
        React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' } },
            showNewProjectInput ? React.createElement(
                'div',
                { style: { display: 'flex', gap: '0.5rem', alignItems: 'center' } },
                React.createElement(
                    'input',
                    {
                        type: 'text',
                        value: newProjectTitle,
                        onChange: (e) => setNewProjectTitle(e.target.value),
                        onKeyDown: handleKeyPress,
                        placeholder: 'Project title...',
                        autoFocus: true,
                        style: {
                            padding: '0.5rem',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            background: 'var(--surface)',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            minWidth: '150px'
                        }
                    }
                ),
                React.createElement(
                    'button',
                    {
                        onClick: handleNewProject,
                        className: 'btn btn-primary',
                        disabled: !newProjectTitle.trim()
                    },
                    '✓'
                ),
                React.createElement(
                    'button',
                    {
                        onClick: () => {
                            setNewProjectTitle('');
                            setShowNewProjectInput(false);
                        },
                        className: 'btn',
                        title: 'Cancel'
                    },
                    '✕'
                )
            ) : React.createElement(
                'button',
                {
                    onClick: () => setShowNewProjectInput(true),
                    className: 'btn btn-primary',
                    title: 'New Project'
                },
                '+ New Project'
            )
        )
    );
}

// Export for global access
window.Header = Header;