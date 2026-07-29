import { expect, test } from '@playwright/test';

test('serves one full revision in JSON and shared-layout HTML', async ({ page, request }) => {
    const response = await request.get('/build-info.json');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');
    const identity = await response.json();
    expect(identity.revision).toMatch(/^[0-9a-f]{40}$/);
    expect(identity.shortRevision).toBe(identity.revision.slice(0, 7));

    await page.goto('/');
    await expect(page.locator('meta[name="dspace-build-revision"]')).toHaveAttribute(
        'content',
        identity.revision
    );
});
