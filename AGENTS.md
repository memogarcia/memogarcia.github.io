# Agents

## Rules

- Never run `hugo` commands locally.
- All posts go in `content/posts/`. Do not create new content directories or reorganize the structure.
- Images go in `static/img/` and must be referenced as `/img/filename.ext` in markdown, not relative paths.
- New posts default to `draft: true` unless explicitly told to publish.
- Front matter uses only `title`, `date`, and `draft`. Do not add extra fields like `tags`, `categories`, or `description` unless asked.
- Match the tone and style described in TONE_OF_VOICE.md when writing or editing blog content. Do not add filler, marketing language, or exclamation-heavy enthusiasm.

## TickTick work tracking

- Track TODOs, status, and work notes for this repo in the TickTick project `memo.blog` (`projectId: 6a40f0a88f08d3643c6a7d70`) instead of repo-local `worklog.md`.
- Use the Kanban columns `TODO`, `doing`, and `done` when the TickTick MCP exposes them.
- Do not create or update `worklog.md` unless the user explicitly asks for repo-local tracking.

## Tone of Voice

@TONE_OF_VOICE.md
