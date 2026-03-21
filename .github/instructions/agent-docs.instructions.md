---
applyTo: "docs/agent/**"
---

# PianoBingo — Agent Docs Instructions

## Role of `docs/agent/`

`docs/agent/` is for deeper human reference only.

Authoritative Copilot behavior must live in:
- `.github/copilot-instructions.md`
- `.github/instructions/*.instructions.md`

Do not store the primary, normative version of workspace rules in `docs/agent/`.

---

## Editing rules for agent docs

- Prefer updating existing docs over creating new ones.
- Keep `docs/agent/CODING_AGENT_CONTEXT.md` concise and current.
- Remove completed historical checklists, one-off migration logs, and stale audit notes once their information has either become obsolete or been distilled into current guidance.
- Avoid duplicating rules already covered by `.github` instruction files.
- If a rule should affect Copilot automatically, move it into `.github/instructions/` instead of documenting it only in `docs/agent/`.

---

## When to create a file in `docs/agent/`

Create a new file only when one of these is true:
- The user explicitly asks for a separate doc.
- The content is a substantial audit/report that would clutter `CODING_AGENT_CONTEXT.md`.
- The content is long-lived human reference material that does not need automatic Copilot application.

Otherwise, prefer either:
- updating `CODING_AGENT_CONTEXT.md`, or
- updating `.github` instruction files.

---

## Preferred content split

- `.github/copilot-instructions.md`: workspace-wide coding and architecture rules
- `.github/instructions/testing.instructions.md`: test-specific rules for `tests/**`
- `.github/instructions/agent-docs.instructions.md`: documentation-maintenance rules for `docs/agent/**`
- `docs/agent/CODING_AGENT_CONTEXT.md`: deeper architecture context and current project decisions

---

## Quality bar

- Keep docs accurate to the current repo state.
- Use current names only; do not preserve old conventions for historical reference unless the history itself matters.
- Delete or fold stale docs rather than letting them drift.
