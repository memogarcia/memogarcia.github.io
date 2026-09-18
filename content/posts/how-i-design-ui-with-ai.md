---
title: "How I design UI with AI"
date: 2026-09-18T12:38:00+09:00
draft: false
---

Why did my AI-generated interfaces keep looking amateurish?

I asked a model for a complete React view in one prompt. It returned four hundred lines of nested JSX and Tailwind classes. The page looked fine for thirty seconds, then fell apart when I resized the browser or connected real state.

I spent days arguing with prompts about padding, broken hover states, and sidebars that stopped aligning after every “refinement.”

The model was writing code before I had made decisions about layout, density, or behavior. It had to invent the geometry, visual hierarchy, component boundaries, and state transitions at the same time.

UI and UX design is not a one-shot process. It is refinement. The better I understand the problem and the people using the product, the more deliberately I can design around their intentions.

I changed the order: picture, ASCII, contracts, component.

## Start with a picture

I start in ChatGPT, but I ask for images before code.

I don’t use Figma because I really don’t know how.

I describe the product philosophy instead of stacking aesthetic buzzwords:

> Create a brutally minimal UI for a desktop application. Reduce, simplify, and subtract what is not needed. Every control must help someone complete work. Use a text-first layout, clean typography, quiet charcoal and off-white surfaces, and no decorative chrome.

The result is a direction, not a specification. I can judge the density, hierarchy, and overall posture without pretending the image defines real behavior.

<figure>
  <img src="/img/ui-with-ai-command-palette-concept.png" alt="A minimal work tracker with a command palette centered over a quiet task list">
  <figcaption>The generated concept. Useful for direction, unreliable as implementation detail.</figcaption>
</figure>

The image cannot tell me how the dialog behaves when a title wraps, the viewport narrows, or someone presses Escape. That work starts in text.

## Translate the picture into ASCII

I open `layouts.md` and redraw the useful structure in a monospace grid.

```text
+-----------------------------------------------------------------+
|  Search projects, tasks, docs…                             Esc   |
+-----------------------------------------------------------------+
|  WORK & PROJECTS                                                |
|  > Cluster ingress migration        Core Platform               |
|    Core Platform                    Project                     |
|                                                                 |
|  ACTIONS                                                        |
|    Create new task                 C                            |
|    Workspace settings              Settings > Workspace         |
+-----------------------------------------------------------------+
|  ↑↓ Navigate        Enter Open        Esc Close                  |
+-----------------------------------------------------------------+
```

The grid forces decisions that an image can avoid. The search field has one row. Results have a primary and secondary label. Actions live in a separate group. The footer owns keyboard help.

The model now receives boundaries instead of a screenshot full of visual guesses.

## Lock the layout contract

The ASCII drawing becomes a layout contract once I accept its geometry. This stops the next agent prompt from treating settled decisions as suggestions.

I write the contract in `LAYOUT_CONTRACT.md`:

```markdown
# Command dialog layout contract

Status: accepted
Changes require explicit approval.

- Dialog width: 650px maximum with 24px viewport margins
- Search occupies the first row
- Results keep primary and secondary labels
- Work and actions remain separate groups
- Keyboard help stays in the footer
- Trailing metadata hides below 600px
- Interactive controls keep a 44px minimum target
```

The contract says what must remain stable. It does not freeze typography, contrast, copy, or micro-interactions. An agent can refine those details without moving the walls.

If the layout must change, the agent proposes the contract change before touching code. That makes deviation visible instead of accidental.

## Write the design contract

Before writing components, I add a small `DESIGN.md`. It records the rules that should survive individual prompts:

```markdown
# Product design system

- Quiet, dense, and text-first
- One primary action per view
- White, gray, and charcoal surfaces
- Semantic color only for warnings and destructive actions
- Inline editing before modal forms
- Remove any control that has no current job
```

This is enough for the model to reject most speculative buttons and decorative flourishes. I do not need a design-system manifesto.

## Build one isolated component

I build the component outside the application tree with mock data:

```text
design-system/
├── DESIGN.md
├── layouts.md
├── LAYOUT_CONTRACT.md
├── command-dialog.html
└── command-dialog.tsx
```

The HTML file is the visual harness. The TypeScript component is the implementation. Neither file depends on application routing, global state, or a backend endpoint.

That narrow context makes the model easier to supervise. I can verify spacing, focus, keyboard navigation, empty results, and long labels before application state complicates the work.

## Compare all three stages

This example keeps the generated picture, the ASCII translation, and the final component together. The component tab is live: search the list or use the arrow keys.

<figure style="margin-inline: calc(50% - 50vw); padding-inline: 20px;">
  <iframe src="/demos/ui-with-ai/" title="Live comparison of a generated UI image, its ASCII wireframe, and the final command palette component" loading="lazy" style="display:block; width:min(1080px, 100%); height:720px; margin:auto; border:1px solid currentColor; border-radius:8px;"></iframe>
  <figcaption><a href="/demos/ui-with-ai/">Open the live example in a new page</a></figcaption>
</figure>

The picture chooses a direction. ASCII settles the structure. The isolated component proves the behavior.

Only then do I move it into the application.
