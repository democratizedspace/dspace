#!/usr/bin/env node

import { ensurePlaywrightBrowsers } from './utils/ensure-playwright-browsers.js';

try {
    await ensurePlaywrightBrowsers({ cwd: process.cwd() });
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to ensure Playwright browsers: ${message}`);
    process.exit(1);
}
