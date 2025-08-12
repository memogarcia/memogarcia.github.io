const { useState, useEffect } = React;

function ThemeToggle() {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('pref-theme');
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        
        if (newTheme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        
        localStorage.setItem('pref-theme', newTheme);
    };

    return React.createElement(
        'button',
        {
            className: 'theme-toggle',
            onClick: toggleTheme,
            'aria-label': 'Toggle theme',
            title: `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`
        },
        '🌓'
    );
}

// Export for global access
window.ThemeToggle = ThemeToggle;