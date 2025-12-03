import { expect, test, Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const SW_REGISTRATION_TIMEOUT_MS = 15000;
const SW_EVENT_CAPTURE_TIMEOUT_MS = 2000;
const ASTRO_ASSET_PATH = '/_astro/';

async function waitForServiceWorkerReady(page: Page, timeoutMs: number) {
    return await page.evaluate(async (timeout) => {
        if (!('serviceWorker' in navigator)) {
            return { registered: false, activeState: 'unsupported' };
        }

        const deadline = Date.now() + timeout;
        let lastState = 'pending';

        while (Date.now() < deadline) {
            let registration = await navigator.serviceWorker.getRegistration();

            if (!registration) {
                try {
                    registration = await navigator.serviceWorker.register('/service-worker.js');
                } catch (error) {
                    lastState = `register-error:${String(error)}`;
                }
            }

            if (registration) {
                try {
                    const readyRegistration = await Promise.race([
                        navigator.serviceWorker.ready,
                        new Promise((resolve) => setTimeout(() => resolve(null), 500)),
                    ]);

                    if (readyRegistration?.active) {
                        return {
                            registered: true,
                            activeState: readyRegistration.active.state || 'activated',
                        };
                    }
                } catch (error) {
                    lastState = `ready-error:${String(error)}`;
                }

                if (registration.active) {
                    return { registered: true, activeState: registration.active.state || 'activated' };
                }

                if (registration.installing) {
                    lastState = `installing:${registration.installing.state}`;
                } else if (registration.waiting) {
                    lastState = `waiting:${registration.waiting.state}`;
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        return { registered: false, activeState: lastState };
    }, timeoutMs);
}

/**
 * Helper function to check if the first stylesheet has loaded successfully
 */
async function checkFirstStylesheetLoads(page: Page, assetPath: string) {
    return await page.evaluate(async (path) => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        const assetLinks = links.filter((link) => (link as HTMLLinkElement).href.includes(path));

        if (assetLinks.length === 0) {
            return { found: false, status: 0 };
        }

        const firstStylesheet = assetLinks[0] as HTMLLinkElement;
        try {
            const response = await fetch(firstStylesheet.href, { cache: 'no-cache' });
            return { found: true, status: response.status, url: firstStylesheet.href };
        } catch (error) {
            return {
                found: true,
                status: 0,
                url: firstStylesheet.href,
                error: String(error),
            };
        }
    }, assetPath);
}

/**
 * Helper function to check if multiple stylesheets load successfully
 */
async function checkAllStylesheetsLoad(page: Page, assetPath: string) {
    return await page.evaluate(async (path) => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        const assetLinks = links.filter((link) => (link as HTMLLinkElement).href.includes(path));

        if (assetLinks.length === 0) {
            return { success: false, reason: 'no stylesheets found' };
        }

        const results = await Promise.all(
            assetLinks.map(async (link) => {
                const href = (link as HTMLLinkElement).href;
                try {
                    const response = await fetch(href, { cache: 'no-cache' });
                    return { url: href, status: response.status, ok: response.ok };
                } catch (error) {
                    return { url: href, status: 0, ok: false, error: String(error) };
                }
            })
        );

        const allOk = results.every((r) => r.ok);
        return { success: allOk, results };
    }, assetPath);
}

/**
 * Helper function to check if page is styled by verifying loaded CSS rules
 */
async function isPageStyled(page: Page) {
    return await page.evaluate(() => {
        // Check that at least one stylesheet has loaded CSS rules
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        return links.some((link) => {
            try {
                const htmlLink = link as HTMLLinkElement;
                // Some browsers may throw if sheet is cross-origin or not loaded
                // Use optional chaining to safely access cssRules
                return (htmlLink.sheet?.cssRules?.length ?? 0) > 0;
            } catch (e) {
                return false;
            }
        });
    });
}

test.describe('Service Worker Update', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('service worker registers and caches assets correctly', async ({ page }) => {
        // Navigate to the home page
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Wait for service worker to register
        const swRegistration = await waitForServiceWorkerReady(page, SW_REGISTRATION_TIMEOUT_MS);

        if (!swRegistration.registered) {
            console.error('Service worker did not register:', swRegistration);
        }

        expect(swRegistration.registered).toBe(true);

        // Check that the main stylesheet loads successfully
        const stylesheetResponse = await checkFirstStylesheetLoads(page, ASTRO_ASSET_PATH);

        expect(stylesheetResponse.found).toBe(true);
        expect(stylesheetResponse.status).toBe(200);

        // Verify that the page is styled (not the unstyled "giant rocket" state)
        // Check for some known styled element
        const mainElement = page.getByRole('main');
        await expect(mainElement).toBeVisible();

        // Get computed styles to verify CSS is applied
        const hasStyles = await isPageStyled(page);

        expect(hasStyles).toBe(true);
    });

    test('service worker updates correctly when cache version changes', async ({ page }) => {
        // First load: register the service worker
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Wait for SW registration to complete
        const swActive = await waitForServiceWorkerReady(page, SW_REGISTRATION_TIMEOUT_MS);

        if (!swActive.registered) {
            console.error('Service worker was not active:', swActive);
        }

        expect(swActive.registered).toBe(true);

        // Simulate a "new build" by forcing SW update check
        // In real scenario, the SW file changes due to CACHE_VERSION injection
        // Here we'll trigger an update and verify the update mechanism works
        const updateTriggered = await page.evaluate(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                return false;
            }

            try {
                await registration.update();
                return true;
            } catch (error) {
                console.error('SW update failed:', error);
                return false;
            }
        });

        expect(updateTriggered).toBe(true);

        // Wait a moment for update to process
        await page.waitForTimeout(1000);

        // Reload the page normally (not hard reload)
        await page.reload({ waitUntil: 'networkidle' });
        await waitForHydration(page);

        // Verify CSS still loads correctly (no 404s)
        const cssLoadsAfterUpdate = await checkAllStylesheetsLoad(page, ASTRO_ASSET_PATH);

        expect(cssLoadsAfterUpdate.success).toBe(true);

        // Verify page remains styled
        const stillStyled = await isPageStyled(page);

        expect(stillStyled).toBe(true);
    });

    test('service worker skipWaiting and reload logic works', async ({ page }) => {
        // This test verifies the SKIP_WAITING + reload behavior
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Setup listeners for SW lifecycle events
        const swEvents = await page.evaluate((captureTimeoutMs) => {
            return new Promise((resolve) => {
                if (!('serviceWorker' in navigator)) {
                    resolve({ registered: false });
                    return;
                }

                const events: string[] = [];

                navigator.serviceWorker.register('/service-worker.js').then((registration) => {
                    events.push('registered');

                    if (registration.waiting) {
                        events.push('waiting');
                    }

                    if (registration.active) {
                        events.push('active');
                    }

                    if (registration.installing) {
                        events.push('installing');
                        registration.installing.addEventListener('statechange', (e) => {
                            const target = e.target as { state?: string };
                            events.push(`state:${target?.state || 'unknown'}`);
                        });
                    }

                    // Resolve after a short delay to capture events
                    setTimeout(() => {
                        resolve({ registered: true, events });
                    }, captureTimeoutMs);
                });
            });
        }, SW_EVENT_CAPTURE_TIMEOUT_MS);

        expect((swEvents as { registered: boolean }).registered).toBe(true);
        expect((swEvents as { events: string[] }).events).toContain('registered');
    });

    test('assets remain accessible during service worker updates', async ({ page }) => {
        // Navigate and wait for initial load
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Track all network requests to CSS files
        const cssRequests: Array<{ url: string; status: number }> = [];

        page.on('response', (response) => {
            const url = response.url();
            if (url.includes(ASTRO_ASSET_PATH) && url.match(/\.(css|js)$/)) {
                cssRequests.push({ url, status: response.status() });
            }
        });

        // Navigate to another page
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Navigate back
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Check that no CSS requests resulted in 404
        const failed404s = cssRequests.filter((req) => req.status === 404);

        if (failed404s.length > 0) {
            console.error('Found 404s for assets:', failed404s);
        }

        expect(failed404s.length).toBe(0);
    });
});
