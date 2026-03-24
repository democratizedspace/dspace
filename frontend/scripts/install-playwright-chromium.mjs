import { fileURLToPath } from 'node:url';
import { ensurePlaywrightBrowsers } from './utils/ensure-playwright-browsers.js';

const frontendDir = fileURLToPath(new URL('../', import.meta.url));

try {
    await ensurePlaywrightBrowsers({
        cwd: frontendDir,
        env: process.env,
        installSystemDeps: process.env.PLAYWRIGHT_SKIP_INSTALL_DEPS !== '1',
    });
    console.log('Playwright Chromium setup complete.');
} catch (error) {
    console.error(`Playwright Chromium setup failed: ${error.message}`);
    process.exitCode = 1;
}
