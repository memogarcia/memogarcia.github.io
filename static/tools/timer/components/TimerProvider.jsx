const { createContext, useContext, useReducer, useEffect, useRef } = React;

// Timer Context
const TimerContext = createContext();

// Action types
const ACTIONS = {
    SET_TOPIC: 'SET_TOPIC',
    SET_DURATION: 'SET_DURATION',
    SET_TIME_LEFT: 'SET_TIME_LEFT',
    START_TIMER: 'START_TIMER',
    PAUSE_TIMER: 'PAUSE_TIMER',
    RESUME_TIMER: 'RESUME_TIMER',
    RESET_TIMER: 'RESET_TIMER',
    COMPLETE_TIMER: 'COMPLETE_TIMER',
    SET_THEME: 'SET_THEME',
    LOAD_SESSIONS: 'LOAD_SESSIONS',
    ADD_SESSION: 'ADD_SESSION',
    TICK: 'TICK'
};

// Initial state
const initialState = {
    topic: '',
    duration: 25 * 60, // 25 minutes in seconds
    timeLeft: 25 * 60,
    isRunning: false,
    isPaused: false,
    currentTopic: '',
    status: 'Ready',
    theme: 'light',
    sessions: [],
    view: 'setup' // 'setup' or 'timer'
};

// Timer reducer
function timerReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_TOPIC:
            return {
                ...state,
                topic: action.payload
            };

        case ACTIONS.SET_DURATION:
            const newDuration = action.payload * 60;
            return {
                ...state,
                duration: newDuration,
                timeLeft: state.isRunning ? state.timeLeft : newDuration
            };

        case ACTIONS.SET_TIME_LEFT:
            return {
                ...state,
                timeLeft: action.payload
            };

        case ACTIONS.START_TIMER:
            return {
                ...state,
                isRunning: true,
                isPaused: false,
                currentTopic: state.topic || 'Focus Session',
                status: 'Working...',
                view: 'timer'
            };

        case ACTIONS.PAUSE_TIMER:
            return {
                ...state,
                isPaused: true,
                status: 'Paused'
            };

        case ACTIONS.RESUME_TIMER:
            return {
                ...state,
                isPaused: false,
                status: 'Working...'
            };

        case ACTIONS.RESET_TIMER:
            return {
                ...state,
                isRunning: false,
                isPaused: false,
                timeLeft: state.duration,
                currentTopic: '',
                status: 'Ready',
                view: 'setup'
            };

        case ACTIONS.COMPLETE_TIMER:
            return {
                ...state,
                isRunning: false,
                isPaused: false,
                status: 'Complete!',
                timeLeft: 0
            };

        case ACTIONS.TICK:
            return {
                ...state,
                timeLeft: Math.max(0, state.timeLeft - 1)
            };

        case ACTIONS.SET_THEME:
            return {
                ...state,
                theme: action.payload
            };

        case ACTIONS.LOAD_SESSIONS:
            return {
                ...state,
                sessions: action.payload
            };

        case ACTIONS.ADD_SESSION:
            const updatedSessions = [action.payload, ...state.sessions];
            return {
                ...state,
                sessions: updatedSessions.slice(0, 10) // Keep only last 10 sessions
            };

        default:
            return state;
    }
}

// Storage management
const STORAGE_KEYS = {
    SESSIONS: 'pomodoroSessions',
    THEME: 'pref-theme'
};

// Timer Provider Component
function TimerProvider({ children }) {
    const [state, dispatch] = useReducer(timerReducer, initialState);
    const intervalRef = useRef(null);

    // Load sessions from storage on mount
    useEffect(() => {
        const savedSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
        
        dispatch({ type: ACTIONS.LOAD_SESSIONS, payload: savedSessions });
        dispatch({ type: ACTIONS.SET_THEME, payload: savedTheme });
        
        // Apply theme to body
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }

        // Defer Notification.requestPermission() to a user action (e.g., Start)

        // Keyboard shortcuts - will be setup later after actions are defined
    }, []);

    // Timer tick effect
    useEffect(() => {
        if (state.isRunning && !state.isPaused) {
            intervalRef.current = setInterval(() => {
                dispatch({ type: ACTIONS.TICK });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [state.isRunning, state.isPaused]);

    // Check for timer completion
    useEffect(() => {
        if (state.timeLeft === 0 && state.isRunning) {
            dispatch({ type: ACTIONS.COMPLETE_TIMER });
            
            // Save completed session
            const session = {
                topic: state.currentTopic,
                duration: Math.floor(state.duration / 60),
                completedAt: new Date().toISOString()
            };
            
            dispatch({ type: ACTIONS.ADD_SESSION, payload: session });
            
            // Play notification
            playNotificationSound();
            showNotification(state.currentTopic);
            
            // Auto-reset after 3 seconds
            setTimeout(() => {
                dispatch({ type: ACTIONS.RESET_TIMER });
            }, 3000);
        }
    }, [state.timeLeft, state.isRunning, state.currentTopic, state.duration]);

    // Save sessions to localStorage
    useEffect(() => {
        if (state.sessions.length > 0) {
            localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
        }
    }, [state.sessions]);

    // Update document title and favicon
    useEffect(() => {
        if (state.isRunning && state.view === 'timer') {
            const minutes = Math.floor(state.timeLeft / 60);
            const seconds = state.timeLeft % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.title = `${timeString} - ${state.currentTopic}`;
            
            // Update favicon based on timer state
            const favicon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
            const faviconText = state.isPaused ? '⏸️' : '🍅';
            if (favicon) {
                favicon.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${faviconText}</text></svg>`;
            }
        } else {
            document.title = 'Pomodoro Timer';
            // Reset favicon
            const favicon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
            if (favicon) {
                favicon.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>`;
            }
        }
    }, [state.timeLeft, state.isRunning, state.currentTopic, state.view, state.isPaused]);

    // Utility functions
    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    };

    const showNotification = (topic) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Complete!', {
                body: `${topic} session finished!`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>'
            });
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Action creators
    const actions = {
        setTopic: (topic) => {
            dispatch({ type: ACTIONS.SET_TOPIC, payload: topic });
        },

        setDuration: (minutes) => {
            if (!state.isRunning) {
                dispatch({ type: ACTIONS.SET_DURATION, payload: minutes });
            }
        },

        startTimer: () => {
            if (!state.isRunning) {
                dispatch({ type: ACTIONS.START_TIMER });
                if ('Notification' in window && Notification.permission === 'default') {
                    // Request permission on user action
                    Notification.requestPermission();
                }
            }
        },

        pauseTimer: () => {
            if (state.isRunning && !state.isPaused) {
                dispatch({ type: ACTIONS.PAUSE_TIMER });
            }
        },

        resumeTimer: () => {
            if (state.isRunning && state.isPaused) {
                dispatch({ type: ACTIONS.RESUME_TIMER });
            }
        },

        resetTimer: () => {
            dispatch({ type: ACTIONS.RESET_TIMER });
        },

        setTheme: (theme) => {
            dispatch({ type: ACTIONS.SET_THEME, payload: theme });
            
            // Apply theme to body immediately
            if (theme === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
            
            // Save to localStorage
            localStorage.setItem(STORAGE_KEYS.THEME, theme);
        },

        // Utility methods
        formatTime,

        canStart: () => !state.isRunning,
        canPause: () => state.isRunning && !state.isPaused,
        canResume: () => state.isRunning && state.isPaused,
        canReset: () => true,

        getStats: () => {
            const today = new Date().toDateString();
            const todaySessions = state.sessions.filter(session => 
                new Date(session.completedAt).toDateString() === today
            );
            
            return {
                total: state.sessions.length,
                today: todaySessions.length,
                totalMinutes: state.sessions.reduce((acc, session) => acc + session.duration, 0),
                todayMinutes: todaySessions.reduce((acc, session) => acc + session.duration, 0)
            };
        }
    };

    // Keyboard shortcuts effect
    useEffect(() => {
        const handleKeyboard = (event) => {
            // Only handle shortcuts when not typing in input fields
            if (event.target.tagName === 'INPUT') return;
            
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    if (state.isRunning) {
                        if (state.isPaused) {
                            actions.resumeTimer();
                        } else {
                            actions.pauseTimer();
                        }
                    } else {
                        actions.startTimer();
                    }
                    break;
                case 'KeyR':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        actions.resetTimer();
                    }
                    break;
                case 'Escape':
                    event.preventDefault();
                    actions.resetTimer();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyboard);
        
        return () => {
            document.removeEventListener('keydown', handleKeyboard);
        };
    }, [state.isRunning, state.isPaused]);

    const value = {
        ...state,
        ...actions
    };

    return React.createElement(
        TimerContext.Provider,
        { value },
        children
    );
}

// Custom hook
function useTimer() {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
}

// Export for global access
window.TimerProvider = TimerProvider;
window.useTimer = useTimer;
