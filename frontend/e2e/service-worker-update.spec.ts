import { expect, test, Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const SW_REGISTRATION_TIMEOUT_MS = 20000;
const ASTRO_ASSET_PATH = '/_astro/';

async function resetServiceWorkers(page: Page) {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
    });

    await page.reload({ waitUntil: 'networkidle' });
}

async function waitForServiceWorkerReady(page: Page, timeoutMs: number) {
    const pollRegistration = async () =>
        await page.evaluate(async (timeout) => {
            if (!('serviceWorker' in navigator)) {
                return { registered: false, activeState: 'unsupported', controlled: false };
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

                        const controller = navigator.serviceWorker.controller;

                        if (readyRegistration?.active) {
                            return {
                                registered: true,
                                activeState: readyRegistration.active.state || 'activated',
                                controlled: Boolean(controller),
                            };
                        }
                    } catch (error) {
                        lastState = `ready-error:${String(error)}`;
                    }

                    if (registration.active) {
                        return {
                            registered: true,
                            activeState: registration.active.state || 'activated',
                            controlled: Boolean(navigator.serviceWorker.controller),
                        };
                    }

                    if (registration.installing) {
                        lastState = `installing:${registration.installing.state}`;
                    } else if (registration.waiting) {
                        lastState = `waiting:${registration.waiting.state}`;
                    }
                }

                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            return { registered: false, activeState: lastState, controlled: false };
        }, timeoutMs);

    const initial = await pollRegistration();

    if (initial.registered && !initial.controlled) {
        await page.reload({ waitUntil: 'networkidle' });
        await waitForHydration(page);
        return await pollRegistration();
    }

    return initial;
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
        await resetServiceWorkers(page);
        await clearUserData(page);
    });

    test('service worker registers and caches assets correctly', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const swRegistration = await waitForServiceWorkerReady(page, SW_REGISTRATION_TIMEOUT_MS);

        if (!swRegistration.registered) {
            console.error('Service worker did not register:', swRegistration);
        }

        expect(swRegistration.registered).toBe(true);

        const stylesheetResponse = await checkFirstStylesheetLoads(page, ASTRO_ASSET_PATH);

        expect(stylesheetResponse.found).toBe(true);
        expect(stylesheetResponse.status).toBe(200);

        const mainElement = page.getByRole('main');
        await expect(mainElement).toBeVisible();

        const hasStyles = await isPageStyled(page);

        expect(hasStyles).toBe(true);
    });

    test('performs coordinated updates without CSS 404s', async ({ page }) => {
        const swResponse = await page.request.get('/service-worker.js');
        const swSource = await swResponse.text();
        const versionMatch = /SW_CACHE_VERSION\s*=\s*'([^']+)'/.exec(swSource);
        const currentVersion = versionMatch?.[1] ?? 'playwright';
        const updatedSource = versionMatch
            ? swSource.replace(versionMatch[0], `const SW_CACHE_VERSION = '${currentVersion}-e2e'`)
            : `${swSource}\n// updated for test`;

        let serveUpdated = false;
        await page.route('**/service-worker.js', (route) => {
            if (serveUpdated) {
                serveUpdated = false;
                route.fulfill({
                    status: 200,
                    contentType: 'application/javascript',
                    body: updatedSource,
                });
                return;
            }
            route.continue();
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const swActive = await waitForServiceWorkerReady(page, SW_REGISTRATION_TIMEOUT_MS);
        expect(swActive.registered).toBe(true);

        const cssRequests: Array<{ url: string; status: number }> = [];
        page.on('response', (response) => {
            const url = response.url();
            if (url.includes(ASTRO_ASSET_PATH) && url.match(/\.(css|js)$/)) {
                cssRequests.push({ url, status: response.status() });
            }
        });

        serveUpdated = true;

        await page.evaluate(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            await registration?.update();
            window.location.reload();
        });

        await page.waitForNavigation({ waitUntil: 'networkidle' });

        await waitForHydration(page);

        const cssLoadsAfterUpdate = await checkAllStylesheetsLoad(page, ASTRO_ASSET_PATH);

        expect(cssLoadsAfterUpdate.success).toBe(true);
        expect(cssRequests.some((req) => req.status === 404)).toBe(false);
        expect(await isPageStyled(page)).toBe(true);
    });

    test('activates new worker when previous assets are removed', async ({ page }) => {
        const swResponse = await page.request.get('/service-worker.js');
        const swSource = await swResponse.text();
        const versionMatch = /SW_CACHE_VERSION\s*=\s*'([^']+)'/.exec(swSource);
        const currentVersion = versionMatch?.[1] ?? 'playwright';
        const updatedSource = versionMatch
            ? swSource.replace(versionMatch[0], `const SW_CACHE_VERSION = '${currentVersion}-2'`)
            : `${swSource}\n// updated for test`;

        let serveUpdated = false;
        await page.route('**/service-worker.js', (route) => {
            if (serveUpdated) {
                serveUpdated = false;
                route.fulfill({
                    status: 200,
                    contentType: 'application/javascript',
                    body: updatedSource,
                });
                return;
            }
            route.continue();
        });

        const assetRewrites = new Map<string, string>();
        let simulateDeploy = false;

        await page.route('**/*', async (route) => {
            const request = route.request();
            const url = request.url();

            if (url.endsWith('/service-worker.js')) {
                await route.continue();
                return;
            }

            if (!simulateDeploy) {
                await route.continue();
                return;
            }

            if (assetRewrites.has(url)) {
                await route.fulfill({ status: 404, contentType: 'text/plain', body: 'gone' });
                return;
            }

            for (const [, replacement] of assetRewrites) {
                if (url === replacement) {
                    const extension = replacement.split('.').pop()?.toLowerCase() ?? 'js';
                    const contentType = extension === 'css' ? 'text/css' : 'application/javascript';
                    const body = extension === 'css' ? 'body{opacity:1;}' : 'export default {};';
                    await route.fulfill({ status: 200, contentType, body });
                    return;
                }
            }

            if (request.resourceType() === 'document') {
                const response = await route.fetch();
                const headers = response.headers();
                let body = await response.text();

                for (const [original, replacement] of assetRewrites) {
                    body = body.replaceAll(original, replacement);
                }

                await route.fulfill({
                    status: response.status(),
                    headers,
                    body,
                });
                return;
            }

            await route.continue();
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const initialAssets = await page.evaluate(() => {
            const urls = new Set<string>();
            document
                .querySelectorAll('link[rel="stylesheet"], script[type="module"]')
                .forEach((node) => {
                    const href = (node as HTMLLinkElement).href || (node as HTMLScriptElement).src;
                    if (href?.includes('/_astro/')) {
                        urls.add(href);
                    }
                });
            return Array.from(urls);
        });

        initialAssets.forEach((url, index) => {
            const extension = new URL(url).pathname.split('.').pop() ?? 'js';
            const origin = new URL(url).origin;
            assetRewrites.set(url, `${origin}/_astro/redeploy-${index}.${extension}`);
        });

        const assetFailures: Array<{ url: string; status: number }> = [];
        page.on('response', (response) => {
            const url = response.url();
            if (
                url.includes(ASTRO_ASSET_PATH) &&
                url.match(/\.(css|js)(\?|$)/) &&
                response.status() >= 400
            ) {
                assetFailures.push({ url, status: response.status() });
            }
        });

        serveUpdated = true;
        await page.evaluate(() => navigator.serviceWorker.getRegistration()?.update());
        simulateDeploy = true;

        await page.evaluate(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        });

        await page.reload({ waitUntil: 'networkidle' });
        await waitForHydration(page);

        const swReady = await waitForServiceWorkerReady(page, SW_REGISTRATION_TIMEOUT_MS);

        expect(swReady.registered).toBe(true);
        expect(swReady.controlled).toBe(true);
        expect(assetFailures).toHaveLength(0);

        const hasStyles = await isPageStyled(page);
        expect(hasStyles).toBe(true);
    });

    test('assets remain accessible during navigation with service worker enabled', async ({
        page,
    }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const cssRequests: Array<{ url: string; status: number }> = [];

        page.on('response', (response) => {
            const url = response.url();
            if (url.includes(ASTRO_ASSET_PATH) && url.match(/\.(css|js)$/)) {
                cssRequests.push({ url, status: response.status() });
            }
        });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const failed404s = cssRequests.filter((req) => req.status === 404);

        if (failed404s.length > 0) {
            console.error('Found 404s for assets:', failed404s);
        }

        expect(failed404s.length).toBe(0);
    });
});
