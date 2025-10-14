# Keyboard-Only Walkthrough

This checklist validates the WCAG 2.2 AA keyboard flow. Run it before each release and whenever
major navigation changes land.

1. **Global navigation**
   - Load the home screen (`/`).
   - Press `Tab` until the first nav item receives a visible focus ring.
   - Confirm the skip link, nav items, and "Play" CTA are reachable without mouse interaction.
2. **Quest selection**
   - From the nav, activate "Play" using `Enter` or `Space`.
   - Tab through quest cards; each must expose a focus outline and accessible name.
   - Start the highlighted quest via keyboard.
3. **Quest run**
   - Step through quest options with arrow keys or `Tab`/`Shift+Tab`.
   - Verify choices announce state changes via `aria-live` or inline status text.
   - Ensure the "Finish quest" action is reachable without hidden traps.
4. **Settings panel**
   - Open Settings with the keyboard shortcut or via the nav menu.
   - Check that toggles and sliders expose focus, labels, and instructions.
   - Confirm focus returns to the trigger element when closing the panel.
5. **Regression capture**
   - File observations in `docs/ops/a11y-regressions.md` (create on first issue).
   - Attach Playwright accessibility snapshots when possible.

Record the run date, tester, and findings in the release checklist.
