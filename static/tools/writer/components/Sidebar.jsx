const { useState } = React;

function Sidebar() {
    const { 
        getAllProjects, 
        activeProjectId, 
        setActiveProject, 
        deleteProject, 
        updateProject 
    } = useWriter();
    
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');

    const projects = getAllProjects();

    const handleProjectClick = (projectId) => {
        if (editingProjectId !== projectId) {
            setActiveProject(projectId);
        }
    };

    const handleEditStart = (e, project) => {
        e.stopPropagation();
        setEditingProjectId(project.id);
        setEditingTitle(project.title);
    };

    const handleEditSave = () => {
        if (editingTitle.trim()) {
            updateProject(editingProjectId, { title: editingTitle.trim() });
        }
        setEditingProjectId(null);
        setEditingTitle('');
    };

    const handleEditCancel = () => {
        setEditingProjectId(null);
        setEditingTitle('');
    };

    const handleEditKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleEditSave();
        } else if (e.key === 'Escape') {
            handleEditCancel();
        }
    };

    const handleDelete = (e, projectId) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            deleteProject(projectId);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return React.createElement(
        'div',
        { className: 'writer-sidebar' },
        
        React.createElement(
            'div',
            { className: 'sidebar-section' },
            React.createElement(
                'h3',
                { className: 'sidebar-section-title' },
                `Projects (${projects.length})`
            ),
            
            projects.length === 0 ? React.createElement(
                'div',
                { className: 'empty-state' },
                React.createElement('div', { className: 'empty-state-icon' }, '📝'),
                React.createElement('p', null, 'No projects yet'),
                React.createElement('p', { style: { fontSize: '0.75rem' } }, 'Click "New Project" to get started')
            ) : React.createElement(
                'ul',
                { className: 'project-list' },
                projects.map(project => React.createElement(
                    'li',
                    {
                        key: project.id,
                        className: `project-item ${activeProjectId === project.id ? 'active' : ''}`,
                        onClick: () => handleProjectClick(project.id)
                    },
                    
                    // Project content
                    React.createElement(
                        'div',
                        { 
                            style: { 
                                flex: 1,
                                minWidth: 0,
                                cursor: 'pointer'
                            } 
                        },
                        
                        editingProjectId === project.id ? React.createElement(
                            'input',
                            {
                                type: 'text',
                                value: editingTitle,
                                onChange: (e) => setEditingTitle(e.target.value),
                                onKeyDown: handleEditKeyPress,
                                onBlur: handleEditSave,
                                autoFocus: true,
                                onClick: (e) => e.stopPropagation(),
                                style: {
                                    width: '100%',
                                    padding: '0.25rem',
                                    border: '1px solid var(--primary)',
                                    borderRadius: 'var(--radius)',
                                    background: 'var(--background)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem'
                                }
                            }
                        ) : React.createElement(
                            'div',
                            null,
                            React.createElement(
                                'div',
                                { 
                                    style: { 
                                        fontWeight: activeProjectId === project.id ? '600' : '400',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    } 
                                },
                                project.title
                            ),
                            React.createElement(
                                'div',
                                { 
                                    style: { 
                                        fontSize: '0.7rem',
                                        color: 'var(--text-tertiary)',
                                        marginTop: '0.25rem'
                                    } 
                                },
                                `${formatDate(project.updatedAt)} • ${project.content.length} chars`
                            )
                        )
                    ),
                    
                    // Action buttons (only show on hover/active)
                    activeProjectId === project.id && editingProjectId !== project.id && React.createElement(
                        'div',
                        { 
                            style: { 
                                display: 'flex',
                                gap: '0.25rem',
                                marginLeft: '0.5rem'
                            } 
                        },
                        React.createElement(
                            'button',
                            {
                                onClick: (e) => handleEditStart(e, project),
                                style: {
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    borderRadius: 'var(--radius)',
                                    fontSize: '0.75rem'
                                },
                                title: 'Rename project'
                            },
                            '✎'
                        ),
                        projects.length > 1 && React.createElement(
                            'button',
                            {
                                onClick: (e) => handleDelete(e, project.id),
                                style: {
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--danger)',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    borderRadius: 'var(--radius)',
                                    fontSize: '0.75rem'
                                },
                                title: 'Delete project'
                            },
                            '🗑'
                        )
                    )
                ))
            )
        ),
        
        // Quick stats section
        projects.length > 0 && React.createElement(
            'div',
            { className: 'sidebar-section' },
            React.createElement(
                'h3',
                { className: 'sidebar-section-title' },
                'Stats'
            ),
            React.createElement(
                'div',
                { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' } },
                React.createElement(
                    'div',
                    { style: { marginBottom: '0.5rem' } },
                    `Total characters: ${projects.reduce((sum, p) => sum + p.content.length, 0).toLocaleString()}`
                ),
                React.createElement(
                    'div',
                    { style: { marginBottom: '0.5rem' } },
                    `Words (approx): ${Math.ceil(projects.reduce((sum, p) => sum + p.content.length, 0) / 5).toLocaleString()}`
                ),
                React.createElement(
                    'div',
                    null,
                    `Last updated: ${formatDate(Math.max(...projects.map(p => new Date(p.updatedAt))))}`
                )
            )
        )
    );
}

// Export for global access
window.Sidebar = Sidebar;