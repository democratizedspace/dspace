# Keyboard-only accessibility walkthrough

_Last updated: 2025-10-14_

This checklist captures the manual keyboard journey we must validate each release. Run it on the
production build (or a staging build served with the service worker enabled) before shipping.

## Pre-flight

- [ ] Clear browser caches or start a fresh profile to ensure we test the current asset bundle.
- [ ] Enable any feature flags that affect navigation, quests, or settings.
- [ ] Confirm screen-reader support is ready if you are pairing the walkthrough with assistive
      technology testing.

## Global navigation

1. [ ] Load the home page and press `Tab` to ensure the skip-link receives focus and is visually
       obvious.
2. [ ] Continue tabbing through primary navigation items (`Play`, `Quests`, `Settings`) and verify the
       focus ring meets contrast requirements.
3. [ ] Activate each link with `Enter` and confirm focus moves to the main landmark of the target view.

## Quest selection

1. [ ] From the quest list, use arrow keys or `Tab`/`Shift+Tab` to move between quests.
2. [ ] Trigger the quest details with `Enter` or `Space` and check that the modal/dialog announces its
       role and grabs focus.
3. [ ] Dismiss the dialog with `Esc` and ensure focus returns to the previously selected quest.

## Quest run

1. [ ] Start a quest using the keyboard and confirm initial focus appears on the first narrative node.
2. [ ] Step through each option using arrow keys or `Tab` and confirm that focus indicators stay
       visible against the background art.
3. [ ] Complete the quest and verify that the completion summary is reachable without the mouse.
4. [ ] Refresh the page while offline (use dev tools to simulate offline) and confirm cached assets and
       quest state persist; focus should return to the current decision node.

## Settings

1. [ ] Navigate to `Settings` via the global nav and confirm the first interactive control receives
       focus.
2. [ ] Toggle each privacy and telemetry option via keyboard controls and confirm associated helper
       text updates with `aria-live` announcements when applicable.
3. [ ] Save or apply settings without the mouse and verify a confirmation toast/snackbar is announced
       to assistive tech.

## Wrap-up

- [ ] Re-enable network access (if disabled) and check that sync logic resumes without disrupting
      focus.
- [ ] Capture screenshots or export accessibility trees (Playwright or browser dev tools) for the
      release log.
- [ ] File follow-up tickets for any regressions and link them in the release checklist.

