# Writer App UI Theme

This directory contains the core UI/UX files that make up the Writer app's clean, minimal theme inspired by ChatGPT.

## Files Included

- **index.css** - Main CSS file with the color system using CSS variables for light/dark mode
- **tailwind.config.js** - Tailwind configuration extending the default theme with custom colors
- **ThemeToggle.tsx** - React component for toggling between light and dark modes
- **ThemeContext.tsx** - React context for managing theme state across the app
- **AnimatedContainer.tsx** - Framer Motion wrapper for smooth animations
- **ui/** - Directory containing reusable UI components (Tabs, Toast, Toaster)
- **cn.ts** - Utility function for merging className strings (clsx + tailwind-merge)

## Color System

The theme uses CSS variables that automatically switch between light and dark modes:

```css
--color-bg: Main background
--color-bg-secondary: Secondary background (sidebars)
--color-text: Primary text
--color-text-secondary: Secondary text
--color-text-muted: Muted text
--color-border: Border color
--color-hover: Hover state background
```

## Key Features

- Clean, minimal design with subtle borders
- Smooth transitions (0.2-0.4s duration)
- Dark mode support with system preference detection
- Consistent spacing and typography
- Framer Motion animations with custom easing [0.4, 0, 0.2, 1]

## Usage

To use this theme in another React + Tailwind project:

1. Copy these files to your project
2. Import the CSS file in your main entry point
3. Update your Tailwind config to extend the theme
4. Wrap your app with the ThemeProvider
5. Use the color classes like `bg-bg`, `text-primary`, etc.