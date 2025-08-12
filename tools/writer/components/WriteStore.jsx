const { createContext, useContext, useReducer, useEffect } = React;

// Writer Context
const WriterContext = createContext();

// Action types
const ACTIONS = {
    LOAD_DATA: 'LOAD_DATA',
    SET_ACTIVE_PROJECT: 'SET_ACTIVE_PROJECT',
    ADD_PROJECT: 'ADD_PROJECT',
    UPDATE_PROJECT: 'UPDATE_PROJECT',
    DELETE_PROJECT: 'DELETE_PROJECT',
    UPDATE_CONTENT: 'UPDATE_CONTENT',
    ADD_TO_CLIPBOARD: 'ADD_TO_CLIPBOARD',
    REMOVE_FROM_CLIPBOARD: 'REMOVE_FROM_CLIPBOARD',
    SET_THEME: 'SET_THEME'
};

// Initial state
const initialState = {
    projects: new Map(),
    activeProjectId: null,
    clipboard: [],
    theme: 'light'
};

// Utility functions
const generateId = () => 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
const sanitizeInput = (input) => typeof input === 'string' ? input.trim() : '';

// Writer reducer
function writerReducer(state, action) {
    switch (action.type) {
        case ACTIONS.LOAD_DATA: {
            return {
                ...state,
                projects: new Map(action.payload.projects || []),
                activeProjectId: action.payload.activeProjectId || null,
                clipboard: action.payload.clipboard || [],
                theme: action.payload.theme || 'light'
            };
        }

        case ACTIONS.SET_ACTIVE_PROJECT: {
            return {
                ...state,
                activeProjectId: action.payload.projectId
            };
        }

        case ACTIONS.ADD_PROJECT: {
            const project = {
                id: generateId(),
                title: sanitizeInput(action.payload.title) || 'Untitled Project',
                content: '',
                sections: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const newProjects = new Map(state.projects);
            newProjects.set(project.id, project);
            
            return {
                ...state,
                projects: newProjects,
                activeProjectId: project.id
            };
        }

        case ACTIONS.UPDATE_PROJECT: {
            const project = state.projects.get(action.payload.id);
            if (!project) return state;

            const updatedProject = {
                ...project,
                ...action.payload.updates,
                updatedAt: new Date().toISOString()
            };

            const newProjects = new Map(state.projects);
            newProjects.set(action.payload.id, updatedProject);

            return {
                ...state,
                projects: newProjects
            };
        }

        case ACTIONS.DELETE_PROJECT: {
            const newProjects = new Map(state.projects);
            newProjects.delete(action.payload.id);
            
            const newActiveProjectId = state.activeProjectId === action.payload.id 
                ? (newProjects.size > 0 ? Array.from(newProjects.keys())[0] : null)
                : state.activeProjectId;

            return {
                ...state,
                projects: newProjects,
                activeProjectId: newActiveProjectId
            };
        }

        case ACTIONS.UPDATE_CONTENT: {
            const project = state.projects.get(action.payload.projectId);
            if (!project) return state;

            const updatedProject = {
                ...project,
                content: action.payload.content,
                updatedAt: new Date().toISOString()
            };

            const newProjects = new Map(state.projects);
            newProjects.set(action.payload.projectId, updatedProject);

            return {
                ...state,
                projects: newProjects
            };
        }

        case ACTIONS.ADD_TO_CLIPBOARD: {
            const clipboardItem = {
                id: generateId(),
                content: sanitizeInput(action.payload.content),
                source: action.payload.source || 'manual',
                createdAt: new Date().toISOString()
            };

            return {
                ...state,
                clipboard: [clipboardItem, ...state.clipboard.slice(0, 49)] // Keep max 50 items
            };
        }

        case ACTIONS.REMOVE_FROM_CLIPBOARD: {
            return {
                ...state,
                clipboard: state.clipboard.filter(item => item.id !== action.payload.id)
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
const STORAGE_KEY = 'writer-app-data';
const VERSION = '1.0.0';

const saveToStorage = (state) => {
    try {
        const data = {
            version: VERSION,
            projects: Array.from(state.projects.entries()),
            activeProjectId: state.activeProjectId,
            clipboard: state.clipboard.slice(0, 50), // Limit clipboard size
            theme: state.theme,
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
        if (!stored) return { projects: [], activeProjectId: null, clipboard: [], theme: 'light' };

        const data = JSON.parse(stored);
        return {
            projects: data.projects || [],
            activeProjectId: data.activeProjectId || null,
            clipboard: data.clipboard || [],
            theme: data.theme || 'light'
        };
    } catch (error) {
        console.error('Failed to load from storage:', error);
        return { projects: [], activeProjectId: null, clipboard: [], theme: 'light' };
    }
};

// Writer Store Provider Component
function WriterStoreProvider({ children }) {
    const [state, dispatch] = useReducer(writerReducer, initialState);

    // Load from storage on mount
    useEffect(() => {
        const savedData = loadFromStorage();
        dispatch({
            type: ACTIONS.LOAD_DATA,
            payload: savedData
        });
        
        // Apply theme to body
        if (savedData.theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, []);

    // Save to storage when state changes
    useEffect(() => {
        if (state.projects.size > 0 || state.clipboard.length > 0 || state.theme !== 'light') {
            saveToStorage(state);
        }
    }, [state]);

    // Action creators
    const actions = {
        setActiveProject: (projectId) => {
            dispatch({
                type: ACTIONS.SET_ACTIVE_PROJECT,
                payload: { projectId }
            });
        },

        addProject: (title) => {
            dispatch({
                type: ACTIONS.ADD_PROJECT,
                payload: { title }
            });
        },

        updateProject: (id, updates) => {
            dispatch({
                type: ACTIONS.UPDATE_PROJECT,
                payload: { id, updates }
            });
        },

        deleteProject: (id) => {
            dispatch({
                type: ACTIONS.DELETE_PROJECT,
                payload: { id }
            });
        },

        updateContent: (projectId, content) => {
            dispatch({
                type: ACTIONS.UPDATE_CONTENT,
                payload: { projectId, content }
            });
        },

        addToClipboard: (content, source) => {
            dispatch({
                type: ACTIONS.ADD_TO_CLIPBOARD,
                payload: { content, source }
            });
        },

        removeFromClipboard: (id) => {
            dispatch({
                type: ACTIONS.REMOVE_FROM_CLIPBOARD,
                payload: { id }
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
        getActiveProject: () => {
            return state.activeProjectId ? state.projects.get(state.activeProjectId) : null;
        },

        getAllProjects: () => {
            return Array.from(state.projects.values())
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
    };

    const value = {
        ...state,
        ...actions
    };

    return React.createElement(
        WriterContext.Provider,
        { value },
        children
    );
}

// Custom hook
function useWriter() {
    const context = useContext(WriterContext);
    if (!context) {
        throw new Error('useWriter must be used within a WriterStoreProvider');
    }
    return context;
}

// Export for global access
window.WriterStoreProvider = WriterStoreProvider;
window.useWriter = useWriter;