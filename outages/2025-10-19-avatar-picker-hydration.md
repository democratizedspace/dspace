# 2025-10-19-avatar-picker-hydration

- **Date:** 2025-10-19
- **Component:** frontend
- **Root cause:** The profile AvatarPicker component rendered without any hydration marker, so the e2e test clicked the pre-hydration buttons before Svelte attached event handlers and the Select button navigation never fired.
- **Resolution:** AvatarPicker now exposes a data-hydrated attribute once onMount runs and the profile avatar selection e2e test waits for that signal before interacting with the picker.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18626214170
  - frontend/src/components/svelte/AvatarPicker.svelte
  - frontend/e2e/profile-avatar-selection.spec.ts
