function TimerControls() {
    const { 
        startTimer, 
        pauseTimer, 
        resumeTimer, 
        resetTimer,
        canStart,
        canPause,
        canResume,
        canReset,
        isPaused
    } = useTimer();

    const handleStart = () => {
        startTimer();
    };

    const handlePauseResume = () => {
        if (isPaused) {
            resumeTimer();
        } else {
            pauseTimer();
        }
    };

    const handleReset = () => {
        resetTimer();
    };

    return React.createElement(
        'div',
        { className: 'controls' },
        React.createElement(
            'button',
            {
                id: 'startBtn',
                className: 'btn btn-start',
                onClick: handleStart,
                disabled: !canStart()
            },
            'Start'
        ),
        React.createElement(
            'button',
            {
                id: 'pauseBtn',
                className: 'btn btn-pause',
                onClick: handlePauseResume,
                disabled: !canPause() && !canResume()
            },
            isPaused ? 'Resume' : 'Pause'
        ),
        React.createElement(
            'button',
            {
                id: 'resetBtn',
                className: 'btn btn-reset',
                onClick: handleReset,
                disabled: !canReset()
            },
            'Reset'
        )
    );
}

// Export for global access
window.TimerControls = TimerControls;