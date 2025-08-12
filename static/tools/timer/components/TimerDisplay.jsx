function TimerDisplay() {
    const { 
        currentTopic, 
        timeLeft, 
        status, 
        view, 
        formatTime 
    } = useTimer();

    // Only show timer display when in timer view
    if (view !== 'timer') {
        return null;
    }

    return React.createElement(
        'div',
        { className: 'timer-display' },
        React.createElement(
            'div',
            {
                id: 'current-topic',
                className: 'current-topic'
            },
            currentTopic
        ),
        React.createElement(
            'div',
            {
                id: 'timer',
                className: 'timer'
            },
            formatTime(timeLeft)
        ),
        React.createElement(
            'div',
            {
                id: 'status',
                className: 'status'
            },
            status
        )
    );
}

// Export for global access
window.TimerDisplay = TimerDisplay;