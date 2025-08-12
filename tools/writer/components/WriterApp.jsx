const { useEffect } = React;

// Inner component that uses the writer context
function WriterAppInner() {
    const { getAllProjects, addProject } = useWriter();

    // Initialize with a default project if none exist
    useEffect(() => {
        const projects = getAllProjects();
        if (projects.length === 0) {
            // Create a welcome project
            addProject('Welcome to Writer');
        }
    }, []);

    return React.createElement(
        'div',
        { className: 'writer-app' },
        
        // Theme toggle (positioned absolutely)
        React.createElement(ThemeToggle),
        
        // Header
        React.createElement(Header),
        
        // Main layout
        React.createElement(
            'div',
            { className: 'writer-main' },
            
            // Sidebar
            React.createElement(Sidebar),
            
            // Main editor
            React.createElement(MainEditor),
            
            // Clipboard panel
            React.createElement(ClipboardPanel)
        )
    );
}

// Main app component that provides the context
function WriterApp() {
    return React.createElement(
        WriterStoreProvider,
        null,
        React.createElement(WriterAppInner)
    );
}

// Export for global access
window.WriterApp = WriterApp;