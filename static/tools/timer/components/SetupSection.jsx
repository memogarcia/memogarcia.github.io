function SetupSection() {
    const { 
        topic, 
        setTopic, 
        duration, 
        setDuration, 
        isRunning,
        view 
    } = useTimer();

    const handleTopicChange = (e) => {
        setTopic(e.target.value);
    };

    const handleDurationChange = (e) => {
        const minutes = parseInt(e.target.value) || 25;
        setDuration(minutes);
    };

    // Only show setup section when in setup view
    if (view !== 'setup') {
        return null;
    }

    return React.createElement(
        'div',
        { className: 'setup-section' },
        React.createElement(
            'div',
            { className: 'input-group' },
            React.createElement('input', {
                type: 'text',
                id: 'topic',
                className: 'input',
                placeholder: 'What are you working on?',
                value: topic,
                onChange: handleTopicChange,
                disabled: isRunning
            })
        ),
        React.createElement(
            'div',
            { className: 'input-group' },
            React.createElement('input', {
                type: 'number',
                id: 'duration',
                className: 'input',
                placeholder: 'Duration (minutes)',
                value: Math.floor(duration / 60),
                min: '1',
                max: '60',
                onChange: handleDurationChange,
                disabled: isRunning
            })
        )
    );
}

// Export for global access
window.SetupSection = SetupSection;