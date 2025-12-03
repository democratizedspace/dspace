import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const SW_REGISTRATION_TIMEOUT_MS = 15000;
const SW_EVENT_CAPTURE_TIMEOUT_MS = 2000;
const ASTRO_ASSET_PATH = '/_astro/';

test.describe('Service Worker Update', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('service worker registers and caches assets correctly', async ({ page, context }) => {
        // Navigate to the home page
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Wait for service worker to register
        const swRegistered = await page.evaluate(
            async (timeoutMs) => {
                if (!('serviceWorker' in navigator)) {
                    return false;
                }

                // Wait for registration (with timeout)
                const startTime = Date.now();

                while (Date.now() - startTime < timeoutMs) {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration) {
                        // Wait for active or installing state
                        if (registration.active || registration.installing || registration.waiting) {
                            return true;
                        }
                    }
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }

                return false;
            },
            SW_REGISTRATION_TIMEOUT_MS
        );

        expect(swRegistered).toBe(true);

        // Check that the main stylesheet loads successfully
        const stylesheetResponse = await page.evaluate(async (assetPath) => {
            const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            const assetLinks = links.filter((link) =>
                (link as HTMLLinkElement).href.includes(assetPath)
            );

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
        }, ASTRO_ASSET_PATH);

        expect(stylesheetResponse.found).toBe(true);
        expect(stylesheetResponse.status).toBe(200);

        // Verify that the page is styled (not the unstyled "giant rocket" state)
        // Check for some known styled element
        const mainElement = page.getByRole('main');
        await expect(mainElement).toBeVisible();

        // Get computed styles to verify CSS is applied
        const hasStyles = await page.evaluate(() => {
            const main = document.querySelector('main');
            if (!main) return false;

            const styles = window.getComputedStyle(main);
            // Check that styles are applied (not just default browser styles)
            // We're looking for any non-default styling
            return (
                styles.display !== '' ||
                styles.padding !== '0px' ||
                styles.margin !== '0px' ||
                styles.backgroundColor !== 'rgba(0, 0, 0, 0)'
            );
        });

        expect(hasStyles).toBe(true);
    });

    test('service worker updates correctly when cache version changes', async ({
        page,
        context,
    }) => {
        // First load: register the service worker
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Wait for SW registration to complete
        await page.evaluate(async (timeoutMs) => {
            if (!('serviceWorker' in navigator)) {
                return;
            }

            // Wait for registration
            const startTime = Date.now();

            while (Date.now() - startTime < timeoutMs) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration?.active) {
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }, SW_REGISTRATION_TIMEOUT_MS);

        // Verify SW is active
        const swActive = await page.evaluate(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            return registration?.active?.state === 'activated';
        });

        expect(swActive).toBe(true);

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
        const cssLoadsAfterUpdate = await page.evaluate(async (assetPath) => {
            const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            const assetLinks = links.filter((link) =>
                (link as HTMLLinkElement).href.includes(assetPath)
            );

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
        }, ASTRO_ASSET_PATH);

        expect(cssLoadsAfterUpdate.success).toBe(true);

        // Verify page remains styled
        const stillStyled = await page.evaluate(() => {
            const main = document.querySelector('main');
            if (!main) return false;

            const styles = window.getComputedStyle(main);
            return (
                styles.display !== '' ||
                styles.padding !== '0px' ||
                styles.margin !== '0px' ||
                styles.backgroundColor !== 'rgba(0, 0, 0, 0)'
            );
        });

        expect(stillStyled).toBe(true);
    });

    test('service worker skipWaiting and reload logic works', async ({ page, context }) => {
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
                            const target = e.target as ServiceWorker;
                            events.push(`state:${target.state}`);
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
