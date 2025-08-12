# CLAUDE.md - Writer App Project Instructions

This document contains specific instructions and context for Claude when working on the Writer app project.

## Project Overview

Writer is a structured writing tool inspired by Jordan Peterson's Essay.app methodology. It features a clean, minimal interface similar to ChatGPT with powerful organization tools for writers.

## Core Design Principles

1. **Minimal & Clean**: Maintain a ChatGPT-like aesthetic with minimal borders and distractions
2. **Smooth Interactions**: All UI changes should have smooth transitions and animations
3. **Keyboard-First**: Every major action should have a keyboard shortcut
4. **Dark Mode Support**: All new components must work in both light and dark modes
5. **Performance**: Use virtualization for lists over 50 items

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS with custom color system
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit
- **Markdown**: react-markdown with remark-gfm
- **Build Tool**: Vite

## Color System

The app uses CSS variables for theming:
- `--color-bg`: Main background
- `--color-bg-secondary`: Secondary background (sidebars)
- `--color-text`: Primary text
- `--color-text-secondary`: Secondary text
- `--color-text-muted`: Muted text
- `--color-border`: Border color
- `--color-hover`: Hover state background

Always use Tailwind classes like `bg-bg`, `text-primary`, etc. instead of hardcoded colors.

## Component Guidelines

### When creating new components:
1. Use functional components with TypeScript
2. Include proper TypeScript interfaces for props
3. Support dark mode by using the color system
4. Add smooth transitions with `transition-colors` or Framer Motion
5. Follow the existing file structure pattern

### Animation Standards:
- Use Framer Motion for complex animations
- Standard duration: 0.2-0.4s
- Easing: `[0.4, 0, 0.2, 1]` (custom ease-out)
- New paragraphs should have the green border animation

## Key Features & Shortcuts

### Keyboard Shortcuts:
- **Cmd/Ctrl + Enter**: Save paragraph
- **Shift + Enter**: Split paragraph
- **Cmd/Ctrl + F**: Search
- **Cmd/Ctrl + Z**: Undo
- **Cmd/Ctrl + Shift + Z**: Redo
- **Enter**: Submit new paragraph (in bottom input)
- **Escape**: Cancel editing

### Core Features:
1. **3-Column Layout**: Documents (left), Editor (center), Tools (right)
2. **Drag & Drop**: Paragraphs can be reordered
3. **Clipboard**: Save paragraphs for later with notes
4. **History**: Track all changes with diff view
5. **Search**: Find text across all paragraphs
6. **Import/Export**: Smart paragraph detection
7. **Settings**: Customizable options

## State Management

The app uses Zustand with localStorage persistence. Key stores:
- Documents and paragraphs
- Clipboard items
- History entries
- UI state (selected items, active tabs)

## Performance Considerations

1. **Virtualization**: Automatically enabled for documents with 50+ paragraphs
2. **Debouncing**: Search and other intensive operations should be debounced
3. **Memoization**: Use React.memo for list items
4. **Lazy Loading**: Heavy components should be code-split

## Import/Export Logic

The `smartSplitParagraphs` function handles various text formats:
- Double newlines (primary separator)
- Single newlines (fallback)
- Markdown headers preservation
- List item grouping
- Long paragraph splitting at ~600 characters

## Testing Approach

While there are no formal tests, ensure:
1. All features work in both light and dark mode
2. Keyboard shortcuts don't conflict
3. Import handles various text formats correctly
4. Performance remains smooth with 100+ paragraphs
5. localStorage persists across sessions

## Common Tasks

### Adding a new tool panel:
1. Create component in `src/components/`
2. Add to `ToolsSidebar` with new tab
3. Update `ToolTab` type in `src/types/index.ts`
4. Add icon from lucide-react

### Adding a keyboard shortcut:
1. Add to the appropriate component's useEffect
2. Prevent default browser behavior
3. Update the keyboard shortcuts list in SettingsModal
4. Document in this file

### Updating colors:
1. Modify CSS variables in `src/index.css`
2. Ensure both light and dark mode values are set
3. Test all components for proper contrast

## Future Enhancements to Consider

1. **Collaboration**: Real-time editing with other users
2. **AI Integration**: Writing suggestions and improvements
3. **Templates**: Pre-made document structures
4. **Export Formats**: PDF, DOCX, etc.
5. **Cloud Sync**: Store documents in the cloud
6. **Mobile App**: React Native version
7. **Plugins**: Extensibility system

## Debugging Tips

1. **State Issues**: Check Zustand devtools
2. **Dark Mode**: Verify CSS variables are applied
3. **Performance**: Use React DevTools Profiler
4. **Drag & Drop**: Check @dnd-kit sensor configuration

## Code Style

- Use meaningful component names
- Keep components focused and small
- Extract reusable logic into hooks
- Use TypeScript strictly (no `any` types)
- Comment complex logic only
- Format with Prettier standards

Remember: The goal is a distraction-free writing experience that feels as clean and simple as ChatGPT while providing powerful organization tools.