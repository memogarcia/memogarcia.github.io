# Tools Design System

This document outlines the shared design system for all interactive tools in the memo.mx toolkit.

## Architecture

### Shared Design System
- **Location**: `/static/tools/shared-design-system.css`
- **Purpose**: Provides consistent base styles, CSS variables, and component patterns across all tools
- **Usage**: Must be imported before tool-specific stylesheets

### Tool-Specific Stylesheets
- **Purpose**: Override and extend shared styles for tool-specific needs
- **Pattern**: Import shared design system first, then add tool-specific customizations

## Design Tokens

### Color System
```css
/* Light Theme */
--theme: #f8fafc;         /* Background */
--entry: #ffffff;         /* Card/container backgrounds */
--primary: #334155;       /* Primary text */
--secondary: #64748b;     /* Secondary text */
--tertiary: #94a3b8;      /* Tertiary text (Timer only) */
--content: #0f172a;       /* High contrast text */
--border: #e2e8f0;        /* Border color */
--muted-foreground: #64748b; /* Muted text */
--accent: #f1f5f9;        /* Hover backgrounds */
--accent-foreground: #0f172a; /* Accent text */

/* Action Colors */
--success: #10b981;       /* Success states */
--warning: #f59e0b;       /* Warning states */
--destructive: #ef4444;   /* Destructive actions */
```

### Typography Scale
```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */
```

### Spacing System
```css
--gap: 24px;              /* Primary spacing unit */
--content-gap: 20px;      /* Content spacing (Timer specific) */
--radius: 8px;            /* Border radius */
```

### Shadow System
```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

## Component Patterns

### Buttons
All buttons should use the base `.btn` class with variant modifiers:

```css
.btn                 /* Base button styles */
.btn-primary        /* Primary action button */
.btn-success        /* Success/start actions */
.btn-warning        /* Warning/pause actions */
.btn-destructive    /* Destructive actions */
```

**HTML Examples:**
```html
<button class="btn btn-primary">Default</button>
<button class="btn btn-success">Start</button>
<button class="btn btn-warning">Pause</button>
<button class="btn btn-destructive">Delete</button>
```

### Inputs
All inputs should use the base `.input` class:

```css
.input              /* Base input styles */
```

### Containers
Use the base `.container` class and override as needed:

```css
.container          /* Base container with card styling */
```

### Headers
Consistent header structure:

```css
.header             /* Header container */
.back-link          /* Navigation back link */
```

### Theme Toggle
Consistent theme toggle across all tools:

```css
.theme-toggle       /* Fixed position theme toggle button */
```

## Tool-Specific Patterns

### Timer Tool
- **Container**: Centered, max-width 400px
- **Layout**: Single-column, card-based
- **Buttons**: Uppercase text with letter-spacing
- **Colors**: Uses `--pause` alias for warning color

### Eisenhower Matrix Tool
- **Container**: Wide layout, max-width 1200px
- **Layout**: Grid-based matrix (2x2)
- **Colors**: Subtle quadrant-specific borders
- **Components**: Modal dialogs, drag-and-drop

## Responsive Design

### Breakpoints
- **Mobile**: 480px and below
- **Tablet**: 768px and below
- **Desktop**: Above 768px

### Responsive Patterns
- Gap reduction on smaller screens
- Button size adjustments for touch targets
- Typography scaling
- Layout stack on mobile (Eisenhower Matrix)

## Implementation Guidelines

### Adding New Tools
1. Import shared design system CSS first
2. Add tool-specific styles in separate stylesheet
3. Use design tokens instead of hardcoded values
4. Follow component patterns for consistency
5. Test across all breakpoints

### Updating Existing Tools
1. Replace hardcoded colors with design tokens
2. Use shared component classes where possible
3. Remove duplicate CSS that exists in shared system
4. Maintain tool-specific functionality and layout

### CSS Organization
1. Import shared design system at top
2. Tool-specific variables and overrides
3. Tool-specific component styles
4. Responsive adjustments

## Migration Status

### Completed
- ✅ Shared design system created
- ✅ Timer tool updated to use shared system
- ✅ Eisenhower Matrix updated to use shared system
- ✅ Theme toggle consistency achieved
- ✅ Button pattern standardization

### Future Improvements
- [ ] Extend to Planner tool
- [ ] Extend to Reminder tool  
- [ ] Add animation/transition tokens
- [ ] Create component library documentation
- [ ] Add accessibility improvements
