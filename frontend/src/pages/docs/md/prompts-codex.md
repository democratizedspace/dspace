---
title: 'Codex Prompts'
slug: 'prompts-codex'
---

# Writing great Codex prompts for the _dspace_ repo (v3)

Codex (Web + CLI) is a sandboxed engineering agent that can open this repository,
run its own tests, and send you a ready‑made PR — but only if you give it a clear,
file‑scoped prompt. :contentReference[oaicite:0]{index=0}

> **TL;DR**  
> 1. Scope the task to one or two files.  
> 2. Say **exactly** what output you expect (diff, test, docs, etc.).  
> 3. Stop talking when the spec is complete. Codex treats _all_ remaining text as
> mandatory instructions. :contentReference[oaicite:1]{index=1}

---

## 1 Quick start (Web vs CLI)

| Use‑case       | Codex Web (ChatGPT sidebar) | Codex CLI                               |
| -------------- | --------------------------- | --------------------------------------- |
| Ad‑hoc feature | “Code” button, attach repo  | `codex "add buy‑button to ProcessView"` |
| Ask a question | “Ask” button                | `codex exec "explain utils/time.ts"`    |
| CI automation  | –                           | `codex exec --full-auto "run npm test"` |

See the upstream CLI reference for more flags. :contentReference[oaicite:2]{index=2}

---

## 2 Prompt ingredients

| Ingredient           | Why it matters                                                     |
| -------------------- | ------------------------------------------------------------------ |
| **Goal sentence**    | Gives the agent a north star (“Add sort dropdown to Item page”).   |
| **Files to touch**   | Limits search space → faster & cheaper.                            |
| **Constraints**      | Coding style, a11y, perf, etc.                                     |
| **Acceptance check** | e.g. “All `npm test` suites pass” or “Return a unified diff only”. |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep
prompt‑level rules short and concrete. :contentReference[oaicite:3]{index=3}

---

## 3 Reusable template

```text
You are working in democratizedspace/dspace (branch v3).

GOAL: <one sentence>.

FILES OF INTEREST
- <path/to/File1>   ← brief hint
- <path/to/File2>

REQUIREMENTS
1. …
2. …
3. …

OUTPUT
Return **only** the patch (diff) needed.
```
