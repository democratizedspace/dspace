# Remote smoke live chat false-negative in clean Playwright sessions (2026-04-01)

- **Summary**: `qa:remote-smoke` with `--chat-mode=live` failed on production with `Expected: "assistant", Received: "error"` even though manual chat checks in a normal browser succeeded.
- **Impact**: Release smoke signaled a production chat outage when the issue was test harness context, not a user-visible prod regression.
- **Root cause**:
  - The smoke test used a fresh Playwright session with no persisted chat credentials/config.
  - The live send path therefore entered the app error flow for that clean session.
  - Manual validation used an existing browser profile with chat settings already configured, so send/receive worked.
- **Resolution**:
  - Kept `--chat-mode=live`, but defaulted its backend to a credential-free Playwright stub (`mock`) that returns a minimal assistant response.
  - Preserved the send/receive UI contract validation (textbox input, send click, user bubble append, assistant bubble append, no error banner winning).
  - Added explicit opt-in real-provider mode: `--chat-live-backend=real`.
- **Lessons / prevention**:
  - Remote production smoke must distinguish app-health regressions from missing per-session credentials in ephemeral test contexts.
  - Secret-free default smoke paths should remain the baseline for portable CI/local reproducibility.
