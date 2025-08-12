const { useEffect } = React;

function PomodoroTimer() {
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

// Render the app
document.addEventListener('DOMContentLoaded', () => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
    
    console.log('Pomodoro Timer React app initialized successfully');
});

// Export for global access
window.PomodoroTimer = PomodoroTimer;
window.App = App;