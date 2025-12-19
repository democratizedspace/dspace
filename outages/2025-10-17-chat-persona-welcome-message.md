# 2025-10-17-chat-persona-welcome-message

- **Date:** 2025-10-17
- **Component:** frontend/chat persona switching
- **Root cause:** The OpenAI chat panel ignored persona changes because the change handler bailed out when the bound persona id already matched the selected option. Svelte updates the bound store before firing the change event, so the handler skipped resetting the welcome message and continued to show dChat's greeting, breaking the chat persona e2e job.
- **Resolution:** Always refresh the welcome message using the newly selected persona and update the e2e assertions so they require the active assistant message to contain the persona's welcome copy. This ensures the correct greeting appears after every persona switch.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18586257662/job/52990714065
