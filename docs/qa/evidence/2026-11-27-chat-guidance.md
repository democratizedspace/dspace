# v3.1 Chat guidance evidence

- Date: 2026-11-27
- Tested application source: `022c81423bcf2bb7bff802ac5f5f4a466095625b`; test-only addition in this change.
- Environment: Linux, Node 24.22.3, local Astro preview, Playwright Chromium,
  `DSPACE_ENV=dev`, `DSPACE_DEFAULT_CHAT_PROVIDER=token-place`.

From `frontend/`, run:

```sh
npm run test:e2e -- chat-save-snapshot-hint.spec.ts --project=chromium --workers=1 --retries=0
```

The isolated run passed. In the hydrated Chat composer, the hint was absent for
an empty draft and an unrelated question. It appeared when the draft asked about
progress and named `/gamesaves`. Dismissing it hid it immediately and kept it
hidden on another matching question after reloading the same tab.

This tests the hint, not save export or parsing. It sends no chat messages and
does not validate a live provider or deployed candidate.

## Default-provider wording

Ran the source search documented in [§12](../v3.1.md#12-automation-evidence)
against the application source listed above and reviewed the matches in the
default Chat path, prompt/debug code, and active release and provider docs.
The old provider launch wording belongs to the v3.0 checklist and changelog,
the early design narrative, and assertions or audit text that name the old copy.
The explicit OpenAI key Settings component is still supported; it does not
make OpenAI the default. The `TokenPlaceChatV2` helper name is not the upstream
API version. This records the wording check in §8, not the broader transport
and compatibility audit in §12.

Also ran both the hint and `chat-rag-context.spec.ts` in one Chromium run:
4 tests passed. The existing source panel test confirms a valid documentation
route is surfaced. It does not establish that all unsupported source URLs are
rejected, so the source-link checkbox remains open.
