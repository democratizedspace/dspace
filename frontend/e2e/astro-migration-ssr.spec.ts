import { expect, test } from '@playwright/test';
import { JSDOM } from 'jsdom';

// These checks exercise the built local application, not a deployed release candidate.
test.beforeEach(async ({ baseURL }) => {
    expect(['127.0.0.1', 'localhost', '[::1]']).toContain(new URL(baseURL || '').hostname);
});

test('awaits Markdown bodies on the homepage, changelog, and outage detail', async ({
    request,
}) => {
    const cases = [
        ['/', 'Time for a DSPACE update.'],
        ['/changelog', 'Time for a DSPACE update.'],
        ['/docs/outages/2025-12-02-v3-ui-regressions', 'Wallet routing regressed'],
    ];
    for (const [path, expectedBody] of cases) {
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
        const html = await response.text();
        expect(html, path).not.toContain('[object Promise]');
        const document = new JSDOM(html).window.document;
        expect(document.body.textContent, path).toContain(expectedBody);
    }
});

test('preserves public avatar image URLs after eager glob migration', async ({ request }) => {
    const response = await request.get('/profile/avatar');
    expect(response.status()).toBe(200);
    const document = new JSDOM(await response.text()).window.document;
    const options = [...document.querySelectorAll('button[aria-label^="Select avatar "]')];
    expect(options).toHaveLength(20);
    for (const option of options) {
        const src = option.querySelector('img')?.getAttribute('src');
        expect(src).toMatch(/^\/(?:assets\/pfp\/|_astro\/)[^/]+\.jpg$/);
        const image = await request.get(src!);
        expect(image.status()).toBe(200);
        expect(image.headers()['content-type']).toContain('image/jpeg');
    }
});

test('keeps Svelte code fences escaped when rendering Markdown', async ({ request }) => {
    const response = await request.get('/docs/ui-lifecycle');
    expect(response.status()).toBe(200);
    const document = new JSDOM(await response.text()).window.document;
    const code = document.querySelector('pre code.language-svelte');
    expect(code).not.toBeNull();
    expect(code!.textContent).toContain('<script>');
    expect(code!.querySelector('script')).toBeNull();
});
