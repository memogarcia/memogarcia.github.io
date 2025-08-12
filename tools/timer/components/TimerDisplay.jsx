function TimerDisplay() {
    const { 
        currentTopic, 
        timeLeft, 
        status, 
        view, 
        formatTime,
        isRunning,
        isPaused
    } = useTimer();

    // Only show timer display when in timer view
    if (view !== 'timer') {
        return null;
    }

    // Determine timer class based on state
    const getTimerClass = () => {
        let classes = ['timer'];
        if (isRunning && !isPaused) {
            classes.push('running');
        } else if (isPaused) {
            classes.push('paused');
        }
        return classes.join(' ');
    };

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
                className: getTimerClass()
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