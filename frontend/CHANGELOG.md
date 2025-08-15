# Changelog

## [Unreleased]

### Added

-   `setup-test-env.js` script to ensure Playwright test directories and artifacts exist
-   `fix-artifact-error.js` script with file watching to prevent ENOENT errors from missing Playwright artifacts
-   `dev:safe` command combining dev server with Playwright artifact error prevention
-   Improved image reference tests with size and dimension validation
-   Auto-creation of placeholder artifacts in Playwright trace directories
-   Better .gitignore handling for test artifacts

### Fixed

-   Unpinned menu items no longer render an extraneous character
-   ENOENT errors related to missing Playwright artifact files
-   Structured documentation for image validation requirements
-   Improved test reliability with proper directory structure

### Documentation

-   Added detailed instructions for preventing Playwright artifact errors
-   Added documentation for image reference tests
-   Updated root README with `dev:safe` command information

## [3.0.0] - 2024-04-01

Initial 3.0.0 stable release.
