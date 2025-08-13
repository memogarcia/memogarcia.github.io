# Driller

AI-guided infinite canvas for root cause analysis. Uses structured methodologies like 5 Whys, Issue Trees, Ishikawa diagrams, First Principles, Concept Maps, and Systems Thinking to help users drill down to root causes.

## Features

- **Interactive Canvas**: Infinite canvas with nodes and edges for visual analysis
- **AI Guidance**: Contextual questions and suggestions based on analysis method
- **Multiple Frameworks**: 5 Whys, Issue Tree, Ishikawa, First Principles, Concept Maps, Systems Thinking
- **Local-First**: Data stored in browser IndexedDB by default
- **Export Options**: PNG, PDF, JSON, and Markdown exports
- **Attachments**: Add code, logs, links, and notes to nodes

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**: Navigate to `http://localhost:3000`

## Usage

1. **Create Project**: Enter a project name and root topic/problem
2. **Select Mode**: Choose an analysis framework (auto-suggested based on input)
3. **Follow AI Guidance**: Answer questions and add context as prompted
4. **Build Canvas**: Nodes and connections are created automatically
5. **Export Results**: Generate summary and export canvas/data

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run e2e` - Run end-to-end tests
- `npm run lint` - Lint code
- `npm run format` - Format code

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Canvas**: React Flow
- **State**: Zustand
- **Storage**: IndexedDB (via idb)
- **Styling**: Tailwind CSS
- **AI**: Pluggable provider interface (mock included)

### Project Structure

```
src/
├── app/           # Main app components
├── canvas/        # React Flow canvas components  
├── ai/            # AI adapter interfaces and providers
├── modes/         # Analysis framework implementations
├── state/         # Zustand stores
├── storage/       # IndexedDB layer
├── export/        # Export functionality
├── components/    # Reusable UI components
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Configuration

Copy `.env.example` to `.env` and configure:

- `VITE_AI_REMOTE`: Set to 'on' for external AI providers
- `VITE_AI_PROVIDER`: 'mock', 'openai', or 'anthropic'
- API keys for external providers

## License

MIT