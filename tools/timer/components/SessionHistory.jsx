function SessionHistory() {
    const { sessions, view, getStats } = useTimer();

    // Only show history when in setup view
    if (view !== 'setup') {
        return null;
    }

    const stats = getStats();

    return React.createElement(
        'div',
        { className: 'stats' },
        React.createElement('h3', null, 'Session History'),
        
        // Stats summary (if we want to add it)
        stats.total > 0 && React.createElement(
            'div',
            { className: 'stats-summary' },
            `Today: ${stats.today} sessions (${stats.todayMinutes} min) • Total: ${stats.total} sessions (${stats.totalMinutes} min)`
        ),
        
        React.createElement(
            'div',
            { id: 'history', className: 'history' },
            sessions.length === 0 
                ? React.createElement(
                    'p',
                    { className: 'no-sessions' },
                    'No sessions yet'
                )
                : sessions.map((session, index) => {
                    const date = new Date(session.completedAt);
                    const dateStr = date.toLocaleDateString();
                    const timeStr = date.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });

                    return React.createElement(
                        'div',
                        {
                            key: `${session.completedAt}-${index}`,
                            className: 'session-item'
                        },
                        React.createElement(
                            'div',
                            { className: 'session-topic' },
                            session.topic
                        ),
                        React.createElement(
                            'div',
                            { className: 'session-meta' },
                            `${session.duration} min • ${dateStr} ${timeStr}`
                        )
                    );
                })
        )
    );
}

// Export for global access
window.SessionHistory = SessionHistory;