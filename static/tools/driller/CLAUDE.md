# CLAUDE.md — Driller

This file tells an AI coding assistant (e.g., Claude) how to build and extend Driller.

## Overview

Driller is a web app with an AI-guided infinite canvas. Users start with a root topic (bug, error log, research topic). The AI asks focused questions, collects context, and builds a connected map. It uses 5 Whys, Issue Trees, Ishikawa, First Principles, Concept Maps, and light Systems Thinking. The end state is a root cause or answer plus a documented reasoning path.

## Goals

- Guide users to root causes / key insights.
- Collect and organize context interactively.
- Visualize everything on an infinite canvas (nodes + edges).
- Output a clear summary of what we found and how we found it.
- Local-first. No third-party tool integrations in MVP.

## Non-Goals (MVP)

- No GitHub/Jira/Notion integrations.
- No real-time multiuser collaboration.
- No web search or external crawling.
- No heavy knowledge base sync.

## Core User Flows

- Start a Session
    - User enters a topic or pastes an error/log/snippet.
    - Root node is created and centered.
- Guided Context Collection
    - AI asks context questions (scoped to topic type).
    - User adds code, links, notes, images.
    - Each answer becomes a node, linked to what it supports.
- Structured Analysis
    - User picks a mode (5 Whys, Issue Tree, Ishikawa, Concept Map, First Principles, Systems).
    - AI drives questions per mode and draws nodes/edges.
- Synthesis
    - AI proposes root causes / conclusions.
    - AI drafts a summary with steps, evidence, and assumptions.
- Save / Export
    - Save to browser (IndexedDB).
    - Export JSON (map data) and PNG/PDF (canvas).
    - Export Markdown summary.

## Acceptance Criteria (MVP)

### Infinite Canvas

- Pan/zoom smoothly.
- Create/edit/delete nodes and edges.
- Auto-layout for trees; manual drag supported.
- 500 nodes, 1000 edges without UI lockup (target).

### Node/Edge Model

- Node has: id, type, title, body, meta, attachments[], position.
- Edge has: id, from, to, label?, meta.
- Types: root, question, answer, evidence, hypothesis, cause, category, conclusion.

### Input & Attachments

- Paste text (logs, notes).
- Paste/attach code blocks (language tagged).
- Add URLs (title fetched client-side if same-origin/CORS ok; else show as raw link).
- Add images (local preview; no upload to server in MVP).

### AI Guidance

- The AI:
    - Asks short, targeted questions.
    - Chooses a mode and explains the next step.
    - Avoids repeating questions if info exists on the canvas.
    - Highlights conflicts and missing context.
    - Stops when diminishing returns are reached and proposes synthesis.
- Safety:
    - Never invents files/links.
    - If uncertain, asks before adding nodes.

### Framework Modes

- 5 Whys: linear chain of why→because nodes (max default depth 5; extendable).
- Issue Tree: MECE branches for causes; depth 2–3 in MVP; labels are actionable.
- Ishikawa: spine + category branches; category presets vary by domain (e.g., Code/Config/Data/Infra/External).
- First Principles: extract assumptions → reduce to fundamentals → rebuild solution.
- Concept Map: key concepts + linking phrases; cross-links allowed.
- Systems (light): allow loop edges; mark reinforcing/balancing (R/B) tags.

### Synthesis & Export

- One-click “Generate Findings”:
    - Problem statement.
    - Approach used.
    - Evidence list (node refs).
    - Causes and rationale.
    - Conclusion(s) and open questions.
    - Next steps / tests.
- Export Markdown and PNG/PDF.

### Persistence (Local-first)

- Autosave every 5 seconds or on change burst.
- Storage in IndexedDB; list sessions; rename/duplicate/delete.
- Import/export project JSON.

## Suggested Tech Stack (replaceable)

- Frontend: TypeScript + React + Vite.
- Canvas/Graph: React Flow (SVG) or Konva (Canvas). Pick one and stick with it.
- State: Zustand or Redux Toolkit.
- Storage: IndexedDB via idb.
- AI Adapter: Pluggable provider interface. Default to a local mock; later wire to an LLM via env var.
- If you change a library, update this file and the ADRs.

## Data Shapes (v0)

```ts
type NodeType =
    | "root" | "question" | "answer" | "evidence"
    | "hypothesis" | "cause" | "category" | "conclusion";

interface Attachment {
    id: string;
    kind: "code" | "image" | "link" | "text";
    title?: string;
    language?: string;     // for code
    url?: string;          // for link/image
    content?: string;      // for text/code
}

interface NodeMeta {
    mode?: "5whys" | "issue-tree" | "ishikawa" | "first-principles" | "concept-map" | "systems";
    createdAt: string;
    updatedAt: string;
    tags?: string[];
    score?: number;        // confidence/relevance
}

interface MapNode {
    id: string;
    type: NodeType;
    title: string;
    body?: string;
    attachments?: Attachment[];
    meta: NodeMeta;
    position: { x: number; y: number };
}

interface MapEdge {
    id: string;
    from: string;
    to: string;
    label?: string;        // e.g., "because", "contributes to"
    meta?: Record<string, unknown>;
}

interface DrillerProject {
    id: string;
    name: string;
    rootNodeId: string;
    nodes: MapNode[];
    edges: MapEdge[];
    history?: any;         // future: ops for undo/redo
    createdAt: string;
    updatedAt: string;
    summary?: string;      // last generated summary (markdown)
}
```

## AI Behavior Contract

### System principles (embed in prompt)

- Be a guide first. Answers last.
- Ask one clear question at a time.
- Use the right framework for the context.
- Reference existing nodes instead of re-asking.
- Create nodes concisely. Titles ≤ 80 chars. Bodies short.
- When evidence is weak, say so.
- Offer to synthesize when progress slows.

### Mode selection heuristic

- Raw incident/log/bug → 5 Whys + Ishikawa (Code/Config/Data/Infra/External).
- Metric drop/business issue → Issue Tree (MECE) + 5 Whys in critical branch.
- Broad learning topic → Concept Map → optional Systems loops.
- Stuck thinking → First Principles → rebuild.

### Question planner (pseudo)

- Read root + last 10 nodes.
- Detect gaps per mode template.
- Emit next best question.
- On answer, create node(s), link, and re-plan.
- After N steps without new info, propose synthesis.

### Synthesis template (markdown)

- Problem
- Method(s) used
- Key evidence (node IDs/titles)
- Candidate causes → selected cause(s)
- Assumptions and risks
- Conclusion
- Next steps / tests

## UI Surface

- Top bar: Project name, mode switcher, “Generate Findings”, Save/Export.
- Left panel: Add node, Search nodes, Mini-map, Outline tree.
- Canvas: nodes/edges, pan/zoom, select/drag, context menu.
- Right panel: Node inspector (title, body, type, attachments, tags).
- Bottom: AI chat dock (collapsible). “Send to canvas” button.

## Security & Privacy

- All data stays in the browser by default.
- Do not send attachments or text to any external API unless AI_REMOTE=on.
- Show a clear badge: Local-only or Sends data to LLM.
- Sanitize pasted HTML. Strip scripts.
- Content Security Policy. Disable inline scripts.

## Performance Targets

- < 16ms frame budget for pan/zoom on mid-size maps.
- Debounce layout and AI calls.
- Virtualize labels where possible.
- Summarize long node bodies for on-canvas display.

## Testing

- Unit:
    - Mode selector picks correct modes by input type.
    - 5 Whys chain stops at configured depth.
    - Issue Tree generator keeps branches MECE when specified.
    - Node/edge CRUD.
    - IndexedDB persistence.
- E2E (Playwright):
    - Create project → add root → run 5 Whys → export PNG/MD.
    - Paste code/log → evidence node created.
    - Reload session → layout and links intact.
- Snapshot:
    - Summary markdown stable given fixed seed.

## Dev Setup

- Node ≥ 20.
- Scripts:
    - dev: run Vite + mock AI.
    - build: production build.
    - test: unit tests.
    - e2e: Playwright.
    - lint / format: ESLint + Prettier.
- Env:
    - AI_REMOTE=off|on
    - AI_PROVIDER=openai|anthropic|mock
    - AI_MODEL=...
    - When AI_REMOTE=off, use a deterministic mock that returns canned questions/answers per mode for demo/testing.
- Repo structure (suggested):

```text
/src
    /app
    /canvas
    /ai
    /modes
    /state
    /storage
    /export
    /components
/tests
/docs
```

## Task Backlog (MVP Order)

- Project scaffold + IndexedDB storage.
- Canvas with nodes/edges + pan/zoom + drag.
- Data model + CRUD + autosave.
- Mode selector UI and state.
- Mock AI adapter with deterministic flows.
- 5 Whys mode (planner + UI affordances).
- Issue Tree mode (branching + labels).
- Ishikawa mode (category presets + layout).
- Concept Map basics (cross-links + labels).
- Synthesis generator (markdown).
- Export PNG/PDF + JSON + MD.
- Performance pass + tests.

## Definition of Done (MVP)

- A user can start with a topic, run a guided session in any one mode, and export a summary and PNG.
- 5 Whys, Issue Tree, Ishikawa all functional.
- Local-first persistence works across reloads.
- Tests cover core flows. Lint passes. Docs updated.

## Open Questions

- Do we want radial vs. hierarchical default layout per mode?
- Should we allow node confidence scores surfaced in UI?
- Do we enforce MECE strictly or mark overlaps?

## Style Guidance

- Short labels. Clear verbs.
- Prefer active voice.
- Avoid jargon in AI questions.
- Keep colors minimal and consistent by node type.
- Keyboard shortcuts for power users (later).

## How Claude Should Work in This Repo

- Propose small, incremental PRs.
- Each PR includes:
    - Summary of change.
    - Tests.
    - Notes on UX and perf impact.
- Ask before adding dependencies.
- When in doubt, default to local-only behavior.
- Keep this CLAUDE.md in sync with changes.
