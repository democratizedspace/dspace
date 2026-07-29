import { expect, test } from '@playwright/test';

test('SSR HTML and runtime endpoint expose the same full build revision', async ({
    page,
    request,
}) => {
    await page.goto('/');
    const marker = page.locator('meta[name="dspace-build-revision"]');
    const revision = await marker.getAttribute('content');
    expect(revision).toMatch(/^[0-9a-f]{40}$/);

    const response = await request.get('/build-info.json');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');
    const identity = await response.json();
    expect(identity.revision).toBe(revision);
    expect(identity.shortRevision).toBe(revision?.slice(0, 7));
    expect(identity.applicationVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(new Date(identity.builtAt).toISOString()).toBe(identity.builtAt);
});
