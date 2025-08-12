# Writer - Structured Writing Tool

A powerful writing application inspired by Jordan Peterson's Essay.app methodology, featuring drag-and-drop paragraph organization, markdown support, and AI-powered writing assistance.

## Features

- **3-Column Layout**: Documents list (left), main editor (center), tools sidebar (right)
- **Drag-and-Drop**: Reorder paragraphs and phrases with smooth animations
- **Markdown Editor**: Bear-like UI/UX with live preview
- **Clipboard**: Save paragraphs for later with notes
- **History Tracking**: Git-diff style change tracking
- **Table of Contents**: Navigate through your document structure
- **Import/Export**: Support for .txt, .md, and .markdown files
- **Auto-save**: All changes persist to localStorage

## Getting Started

### Quick Start
```bash
./run-writer.sh
```

### Manual Setup
```bash
cd writer-app
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. **Writing**: Click "Add a paragraph..." to start writing. Use Markdown syntax for formatting.
2. **Organizing**: Drag paragraphs using the grip handle to reorder them.
3. **Clipboard**: Click the archive icon to move paragraphs to clipboard for later use.
4. **History**: View all changes in the History tab with color-coded diffs.
5. **Navigation**: Use the Table of Contents to jump between sections.
6. **Import/Export**: Use the upload/download buttons to work with external files.

## Design Philosophy

The application emphasizes:
- **Focus**: Clean interface that keeps writing front and center
- **Fluidity**: Smooth interactions for effortless content organization  
- **Intelligence**: Thoughtful features that enhance the writing process

## Technology Stack

- React + TypeScript
- Vite for fast development
- Tailwind CSS for styling
- @dnd-kit for drag-and-drop
- Zustand for state management
- Framer Motion for animations
- React Markdown for rendering