import { existsSync } from 'node:fs';

const executableOverride = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();

if (executableOverride) {
    console.log(existsSync(executableOverride) ? 'available' : 'missing');
    process.exit(0);
}

try {
    const { chromium } = await import('@playwright/test');
    const executablePath = chromium.executablePath();
    console.log(executablePath && existsSync(executablePath) ? 'available' : 'missing');
} catch {
    console.log('missing');
}
