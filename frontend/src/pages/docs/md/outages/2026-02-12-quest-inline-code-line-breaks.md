---
title: 'Quest inline scope chips wrapped onto their own lines (2026-02-12)'
slug: '2026-02-12-quest-inline-code-line-breaks'
summary: 'Inline code chips in the Connect GitHub quest could break before and after `gist` and `repo`, making setup guidance harder to read.'
---

# Quest inline scope chips wrapped onto their own lines (2026-02-12)

- **Summary**: The `welcome/connect-github` quest rendered inline scope names (`gist`, `repo`) with line breaks around each chip in the steps dialogue.
- **Impact**: Setup instructions looked fragmented, so players could misread which GitHub PAT scopes are required.
- **Root cause**:
    - Dialogue formatting treated spaces around inline code as normal break opportunities.
    - On narrower chat bubble widths, browsers wrapped immediately before and after inline code chips.
- **Resolution**:
    - Updated dialogue formatting to convert spaces adjacent to inline code into non-breaking spaces.
    - Added QuestChat regression coverage asserting inline scope chips stay attached to surrounding words.
- **Lessons**:
    - Readability regressions can happen even when content is technically correct.
    - Inline badges/tokens should preserve nearby context to avoid orphaned words.
- **Prevention**:
    - Keep the new QuestChat formatting test in CI to guard inline-code wrapping behavior.
