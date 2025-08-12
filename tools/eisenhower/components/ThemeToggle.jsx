function ThemeToggle() {
    const { theme, setTheme } = useTasks();

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    return React.createElement(
        'button',
        {
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