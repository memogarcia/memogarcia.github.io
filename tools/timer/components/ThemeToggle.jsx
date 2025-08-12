function ThemeToggle() {
    const { theme, setTheme } = useTimer();

    const getNextTheme = (currentTheme) => {
        switch (currentTheme) {
            case 'light': return 'dark';
            case 'dark': return 'sepia';
            case 'sepia': return 'light';
            default: return 'dark';
        }
    };

    const getThemeIcon = (currentTheme) => {
        switch (currentTheme) {
            case 'light': return '☀️';
            case 'dark': return '🌙';
            case 'sepia': return '📖';
            default: return '🌓';
        }
    };

    const getThemeLabel = (currentTheme) => {
        switch (currentTheme) {
            case 'light': return 'Switch to dark theme';
            case 'dark': return 'Switch to sepia theme';
            case 'sepia': return 'Switch to light theme';
            default: return 'Toggle theme';
        }
    };

    const toggleTheme = () => {
        const newTheme = getNextTheme(theme);
        setTheme(newTheme);
    };

    return React.createElement(
        'button',
        {
            id: 'theme-toggle',
            className: 'theme-toggle',
            onClick: toggleTheme,
            'aria-label': getThemeLabel(theme),
            type: 'button'
        },
        getThemeIcon(theme)
    );
}

// Export for global access
window.ThemeToggle = ThemeToggle;