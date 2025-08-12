# Writer App

A structured writing tool inspired by Jordan Peterson's Essay.app methodology, featuring Google OpenID authentication.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production URL
   - Copy your Client ID

3. Create `.env.local` file:
   ```
   VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Features

- Google OpenID authentication
- Structured document creation
- Drag and drop paragraph reordering
- Markdown support
- Clipboard for saving paragraphs
- History tracking
- Dark mode support
- Keyboard shortcuts

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- @react-oauth/google (authentication)
- Framer Motion (animations)
- @dnd-kit (drag and drop)