const { useState, useEffect } = React;

// Main App Component
function App() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading time for dependencies
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return React.createElement(
            'div',
            {
                style: {
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--background)',
                    color: 'var(--text-primary)'
                }
            },
            React.createElement(
                'div',
                { className: 'loading' },
                'Loading Writer...'
            )
        );
    }

    return React.createElement(WriterApp);
}

// Render the app
document.addEventListener('DOMContentLoaded', () => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
    
    console.log('Writer app initialized successfully');
});

// Export for global access
window.WriterApp = WriterApp;
window.App = App;