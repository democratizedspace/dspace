# OUT-2025-10-19-user-journeys-doc-heading

- **Date:** 2025-10-19
- **Component:** docs user journeys page
- **Root cause:** The user journeys Playwright check searched for a lowercase 'User journeys' heading with exact matching, but the doc renders the title-cased 'User Journeys and Test Coverage' heading so the locator never resolved and the suite failed.
- **Resolution:** Made the E2E locator case-insensitive and added a unit test that asserts the documentation keeps the coverage heading and table entry so future title tweaks remain covered.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18622435241/job/53095316970
