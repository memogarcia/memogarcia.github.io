const { useEffect } = React;

function PomodoroTimer() {
    // Check if useTimer is available
    if (typeof useTimer === 'undefined') {
        return React.createElement(
            'div',
            { style: { textAlign: 'center', padding: '2rem', color: '#ef4444' } },
            React.createElement('h2', null, '⚠️ Component Loading Error'),
            React.createElement('p', null, 'Timer context not available. Please refresh the page.')
        );
    }
    
    const { getStats } = useTimer();

    // Expose utility functions to global scope for debugging
    useEffect(() => {
        window.getTimerStats = getStats;
        
        console.log('Pomodoro Timer React loaded. Available console commands:');
        console.log('- getTimerStats() - Get timer statistics');
    }, [getStats]);

    return React.createElement(
        React.Fragment,
        null,
        
        // Theme Toggle
        React.createElement(ThemeToggle),
        
        // Main Container
        React.createElement(
            'div',
            { className: 'container' },
            
            // Header
            React.createElement(
                'div',
                { className: 'header' },
                React.createElement(
                    'a',
                    {
                        href: '/tools/',
                        className: 'back-link'
                    },
                    '← Back to Tools'
                ),
                React.createElement(
                    'h1',
                    null,
                    'Pomodoro Timer'
                )
            ),
            
            // Setup Section (shown when view === 'setup')
            React.createElement(SetupSection),
            
            // Timer Display (shown when view === 'timer')
            React.createElement(TimerDisplay),
            
            // Controls
            React.createElement(TimerControls),
            
            // Session History (shown when view === 'setup')
            React.createElement(SessionHistory)
        )
    );
}

// Main App Component
function App() {
    return React.createElement(
        TimerProvider,
        null,
        React.createElement(PomodoroTimer)
    );
}

// Initialize app function
function initializeApp() {
    try {
        // Check if all dependencies are available
        if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
            throw new Error('React libraries not loaded');
        }
        
        if (typeof TimerProvider === 'undefined') {
            throw new Error('TimerProvider not loaded');
        }
        
        const rootElement = document.getElementById('root');
        if (!rootElement) {
            throw new Error('Root element not found');
        }
        
        // Clear any loading content
        rootElement.innerHTML = '';
        
        const root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(App));
        
        console.log('Pomodoro Timer React app initialized successfully');
        return true;
    } catch (error) {
        console.error('App initialization failed:', error);
        document.getElementById('root').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #ef4444; font-family: system-ui;">
                <h2>🚫 Initialization Failed</h2>
                <p>Error: ${error.message}</p>
                <div style="margin-top: 2rem;">
                    <a href="index-vanilla.html" style="color: #3b82f6; text-decoration: none; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 6px; display: inline-block;">
                        🔄 Use Basic Version
                    </a>
                </div>
            </div>
        `;
        return false;
    }
}

// Try to initialize immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded, try to initialize
    // Use setTimeout to ensure all scripts have executed
    setTimeout(initializeApp, 100);
}

// Export for global access
window.PomodoroTimer = PomodoroTimer;
window.App = App;