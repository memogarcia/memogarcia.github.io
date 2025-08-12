function ThemeToggle() {
    const { theme, setTheme } = useTimer();

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    return React.createElement(
        'button',
        {
            id: 'theme-toggle',
            className: 'theme-toggle',
            onClick: toggleTheme,
            'aria-label': 'Toggle theme',
            type: 'button'
        },
        '🌓'
    );
}

// Export for global access
window.ThemeToggle = ThemeToggle;