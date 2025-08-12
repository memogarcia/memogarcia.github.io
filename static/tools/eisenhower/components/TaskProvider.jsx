const { createContext, useContext, useReducer, useEffect } = React;

// Task Context
const TaskContext = createContext();

// Action types
const ACTIONS = {
    LOAD_TASKS: 'LOAD_TASKS',
    ADD_TASK: 'ADD_TASK',
    UPDATE_TASK: 'UPDATE_TASK',
    DELETE_TASK: 'DELETE_TASK',
    TOGGLE_TASK: 'TOGGLE_TASK',
    SET_EDITING_TASK: 'SET_EDITING_TASK',
    CLEAR_EDITING_TASK: 'CLEAR_EDITING_TASK',
    SET_THEME: 'SET_THEME'
};

// Initial state
const initialState = {
    tasks: new Map(),
    currentEditingTask: null,
    theme: 'light'
};

// Utility functions
const generateId = () => 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
const sanitizeInput = (input) => typeof input === 'string' ? input.trim().slice(0, 500) : '';

// Task reducer
function taskReducer(state, action) {
    switch (action.type) {
        case ACTIONS.LOAD_TASKS: {
            return {
                ...state,
                tasks: new Map(action.payload.tasks || []),
                theme: action.payload.theme || 'light'
            };
        }

        case ACTIONS.ADD_TASK: {
            const task = {
                id: generateId(),
                text: sanitizeInput(action.payload.text),
                notes: sanitizeInput(action.payload.notes || ''),
                quadrant: action.payload.quadrant,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const newTasks = new Map(state.tasks);
            newTasks.set(task.id, task);
            
            return {
                ...state,
                tasks: newTasks
            };
        }

        case ACTIONS.UPDATE_TASK: {
            const task = state.tasks.get(action.payload.id);
            if (!task) return state;

            const updatedTask = {
                ...task,
                ...action.payload.updates,
                updatedAt: new Date().toISOString()
            };

            const newTasks = new Map(state.tasks);
            newTasks.set(action.payload.id, updatedTask);

            return {
                ...state,
                tasks: newTasks
            };
        }

        case ACTIONS.DELETE_TASK: {
            const newTasks = new Map(state.tasks);
            newTasks.delete(action.payload.id);
            
            return {
                ...state,
                tasks: newTasks,
                currentEditingTask: state.currentEditingTask === action.payload.id ? null : state.currentEditingTask
            };
        }

        case ACTIONS.TOGGLE_TASK: {
            const task = state.tasks.get(action.payload.id);
            if (!task) return state;

            const updatedTask = {
                ...task,
                completed: !task.completed,
                updatedAt: new Date().toISOString()
            };

            const newTasks = new Map(state.tasks);
            newTasks.set(action.payload.id, updatedTask);

            return {
                ...state,
                tasks: newTasks
            };
        }

        case ACTIONS.SET_EDITING_TASK: {
            return {
                ...state,
                currentEditingTask: action.payload.taskId
            };
        }

        case ACTIONS.CLEAR_EDITING_TASK: {
            return {
                ...state,
                currentEditingTask: null
            };
        }

        case ACTIONS.SET_THEME: {
            return {
                ...state,
                theme: action.payload.theme
            };
        }

        default:
            return state;
    }
}

// Storage management
const STORAGE_KEY = 'eisenhower-matrix-tasks';
const VERSION = '1.0.0';

const saveToStorage = (tasks, theme) => {
    try {
        const data = {
            version: VERSION,
            tasks: Array.from(tasks.entries()),
            theme,
            lastModified: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to storage:', error);
    }
};

const loadFromStorage = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return { tasks: [], theme: 'light' };

        const data = JSON.parse(stored);
        return {
            tasks: data.tasks || [],
            theme: data.theme || 'light'
        };
    } catch (error) {
        console.error('Failed to load from storage:', error);
        return { tasks: [], theme: 'light' };
    }
};

// Task Provider Component
function TaskProvider({ children }) {
    const [state, dispatch] = useReducer(taskReducer, initialState);

    // Load from storage on mount
    useEffect(() => {
        const { tasks, theme } = loadFromStorage();
        dispatch({
            type: ACTIONS.LOAD_TASKS,
            payload: { tasks, theme }
        });
        
        // Apply theme to body
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, []);

    // Save to storage when tasks or theme change
    useEffect(() => {
        if (state.tasks.size > 0 || state.theme !== 'light') {
            saveToStorage(state.tasks, state.theme);
        }
    }, [state.tasks, state.theme]);

    // Action creators
    const actions = {
        addTask: (text, notes, quadrant) => {
            dispatch({
                type: ACTIONS.ADD_TASK,
                payload: { text, notes, quadrant }
            });
        },

        updateTask: (id, updates) => {
            dispatch({
                type: ACTIONS.UPDATE_TASK,
                payload: { id, updates }
            });
        },

        deleteTask: (id) => {
            dispatch({
                type: ACTIONS.DELETE_TASK,
                payload: { id }
            });
        },

        toggleTask: (id) => {
            dispatch({
                type: ACTIONS.TOGGLE_TASK,
                payload: { id }
            });
        },

        setEditingTask: (taskId) => {
            dispatch({
                type: ACTIONS.SET_EDITING_TASK,
                payload: { taskId }
            });
        },

        clearEditingTask: () => {
            dispatch({
                type: ACTIONS.CLEAR_EDITING_TASK
            });
        },

        setTheme: (theme) => {
            dispatch({
                type: ACTIONS.SET_THEME,
                payload: { theme }
            });
            
            // Apply theme to body immediately
            if (theme === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
            
            // Save to localStorage
            localStorage.setItem('pref-theme', theme);
        },

        // Utility methods
        getTasksByQuadrant: (quadrant) => {
            return Array.from(state.tasks.values())
                .filter(task => task.quadrant === quadrant)
                .sort((a, b) => {
                    // Sort by completion status first, then by creation date
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
        },

        getTaskById: (id) => {
            return state.tasks.get(id);
        },

        getTaskCount: (quadrant) => {
            return Array.from(state.tasks.values())
                .filter(task => task.quadrant === quadrant).length;
        },

        getAllStats: () => {
            const stats = {
                total: state.tasks.size,
                completed: 0,
                byQuadrant: {
                    'urgent-important': 0,
                    'important': 0,
                    'urgent': 0,
                    'neither': 0
                }
            };

            state.tasks.forEach(task => {
                if (task.completed) stats.completed++;
                stats.byQuadrant[task.quadrant]++;
            });

            return stats;
        }
    };

    const value = {
        ...state,
        ...actions
    };

    return React.createElement(
        TaskContext.Provider,
        { value },
        children
    );
}

// Custom hooks
function useTasks() {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
}

// Export for global access
window.TaskProvider = TaskProvider;
window.useTasks = useTasks;