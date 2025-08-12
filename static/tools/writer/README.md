# Writer - Structured Writing Tool

A client-side structured writing application with project management, 3-column layout, and clipboard functionality.

## Structure

```
writer/
├── index.html          # Main application entry point
├── test.html          # Development testing page
├── style.css          # Cyberpunk-themed CSS
├── App.jsx            # Root React application component
├── README.md          # This file
└── components/
    ├── ThemeToggle.jsx     # Dark/light theme switcher
    ├── WriteStore.jsx      # State management (React Context + useReducer)
    ├── Header.jsx          # Top navigation and project controls
    ├── Sidebar.jsx         # Project list and statistics
    ├── MainEditor.jsx      # Primary text editing area
    ├── ClipboardPanel.jsx  # Clipboard management
    └── WriterApp.jsx       # Main app component wrapper
```

## Technology Stack

- **React 18** - UI framework (loaded via CDN)
- **React Context + useReducer** - State management
- **localStorage** - Client-side data persistence
- **Babel Standalone** - JSX transpilation in browser
- **CSS Custom Properties** - Theming system

## Features

### Current (v1.0)
- ✅ Project management (create, rename, delete)
- ✅ Auto-save functionality
- ✅ Dark/light theme toggle
- ✅ Clipboard system for text snippets
- ✅ Word/character counting
- ✅ Responsive 3-column layout
- ✅ localStorage persistence
- ✅ Search clipboard functionality

### Future Enhancements
- 🔄 Drag & drop (will use @dnd-kit)
- 🔄 Rich text editing features
- 🔄 Export functionality (JSON, Markdown, HTML)
- 🔄 Collaborative features
- 🔄 Plugin system
- 🔄 Advanced search and filtering

## Development

### Testing
Open `test.html` in a browser to:
- Verify React dependencies load correctly
- Test localStorage functionality
- Check basic app functionality
- Access the main app

### Adding New Features
1. Create component in `components/` directory
2. Export component to `window` object for global access
3. Import in `index.html` with `<script type="text/babel" src="..."></script>`
4. Use component in parent components

### State Management
The app uses React Context with useReducer for state management:

```javascript
const { 
  projects,           // Map of project objects
  activeProjectId,    // Currently selected project
  clipboard,          // Array of clipboard items
  theme              // Current theme ('light' | 'dark')
} = useWriter();
```

### Storage Format
Data is stored in localStorage as JSON:

```javascript
{
  "version": "1.0.0",
  "projects": [["id", projectObject], ...],
  "activeProjectId": "string",
  "clipboard": [clipboardItem, ...],
  "theme": "light|dark",
  "lastModified": "ISO string"
}
```

### CSS Architecture
- CSS Custom Properties for theming
- Mobile-first responsive design
- Consistent spacing and typography
- Dark/light mode support
- Component-based organization

## Migration Notes

This app was migrated from a Next.js SSR application to a pure client-side app:
- PostgreSQL → localStorage
- Server-side rendering → Client-side React
- Complex build process → Simple HTML + CDN
- Zustand → React Context (for simplicity)

The architecture maintains the original 3-column layout and core functionality while simplifying the deployment and development process.