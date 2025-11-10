# Changelog

## [Unreleased]

### Added

-   `setup-test-env.js` script to ensure Playwright test directories and artifacts exist
-   `fix-artifact-error.js` script with file watching to prevent ENOENT errors from missing Playwright artifacts
-   `dev:safe` command combining dev server with Playwright artifact error prevention
-   Improved image reference tests with size and dimension validation
-   Auto-creation of placeholder artifacts in Playwright trace directories
-   Better .gitignore handling for test artifacts
-   Live `/stats` page highlighting quest, inventory, and process totals
-   Offline toast now announces when connectivity returns before auto-hiding, confirming sync has
    resumed
-   Item form now captures item dependencies with trimming and live previews
-   Manage Items page now offers category filter chips for one-click filtering
-   Accessibility lint now runs before ESLint to block missing ARIA, focus outline removals, and
    low-contrast colour pairings

### Fixed

-   Unpinned menu items no longer render an extraneous character
-   ENOENT errors related to missing Playwright artifact files
-   Structured documentation for image validation requirements
-   Improved test reliability with proper directory structure
-   Copy code button now has visible focus and an ARIA label for screen readers
-   Manage quests page now lists and manages custom quests saved in IndexedDB
-   Settings menu entry now appears as an active destination instead of a disabled placeholder
-   Shop index featured actions now use the correct item slug instead of the numeric placeholder

### Documentation

-   Added detailed instructions for preventing Playwright artifact errors
-   Added documentation for image reference tests
-   Updated root README with `dev:safe` command information

## [3.0.0] - 2024-04-01

Initial 3.0.0 stable release.
