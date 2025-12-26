# Changelog

## [Unreleased]

### Added

- `setup-test-env.js` script to ensure Playwright test directories and artifacts exist
- `fix-artifact-error.js` script with file watching to prevent ENOENT errors from missing Playwright artifacts
- `dev:safe` command combining dev server with Playwright artifact error prevention
- Improved image reference tests with size and dimension validation
- Auto-creation of placeholder artifacts in Playwright trace directories
- Better .gitignore handling for test artifacts
- Live `/stats` page highlighting quest, inventory, and process totals
- Offline toast now announces when connectivity returns before auto-hiding, confirming sync has
  resumed
- Item form now captures item dependencies with trimming and live previews
- Manage Items page now offers category filter chips for one-click filtering
- Accessibility lint now runs before ESLint to block missing ARIA, focus outline removals, and
  low-contrast colour pairings
- Svelte 5 internal import mappings in vitest configuration for proper module resolution
- ProcessForm now clears all fields after successful submission for better UX
- Process creation Playwright coverage now runs end-to-end in CI with success assertions

### Fixed

- Unpinned menu items no longer render an extraneous character
- ENOENT errors related to missing Playwright artifact files
- Structured documentation for image validation requirements
- Improved test reliability with proper directory structure
- Copy code button now has visible focus and an ARIA label for screen readers
- Solar basics step icons now use production artwork instead of placeholder blocks
- Manage quests page now lists and manages custom quests saved in IndexedDB
- Settings menu entry now appears as an active destination instead of a disabled placeholder
- Shop index featured actions now use the correct item slug instead of the numeric placeholder
- Added pricing for the first aid kit so it no longer ships as a beta placeholder item
- Priced the soaked hydroponic starter plug so it no longer uses a beta placeholder
- ISS spotting station now has a real price instead of a beta placeholder
- Photoresistor now has a real price instead of shipping as a beta placeholder component
- Svelte 5 compatibility: vitest now properly resolves internal subpath imports (`svelte/internal/disclose-version`, `svelte/internal/flags/*`)
- Vitest configuration uses client-side Svelte entry point for browser-like test behavior
- ProcessForm test now provides complete valid form data and uses `waitFor` for async operations

### Documentation

- Added detailed instructions for preventing Playwright artifact errors
- Added documentation for image reference tests
- Updated root README with `dev:safe` command information
- Added Svelte 5 compatibility section to AGENTS.md explaining vitest configuration
- Enhanced vitest.md with Svelte 5 import resolution notes
- Added Svelte 5 component unit testing guide to TESTING.md with examples

## [3.0.0] - 2024-04-01

Initial 3.0.0 stable release.
