import { expect, test } from '@playwright/test';
import { purgeClientState, waitForQuestRecordByTitle } from './test-helpers';

const SAMPLE_IMAGE_BYTES = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
    'base64'
);

function escapeRegExp(input: string): string {
    return input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

test.describe('quest management', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
        await page.goto('/quests/create', { waitUntil: 'domcontentloaded' });
    });

    test('displays quest creation form essentials', async ({ page }) => {
        await expect(page.getByRole('heading', { level: 2, name: /create a new quest/i })).toBeVisible();
        await expect(page.getByLabel(/^Title/i)).toBeVisible();
        await expect(page.getByLabel(/^Description/i)).toBeVisible();
        await expect(page.getByLabel(/^Upload an Image/i)).toBeVisible();
        await expect(page.getByLabel(/^NPC Identifier/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /create quest/i })).toBeVisible();
    });

    test('creates a custom quest and lists it', async ({ page }) => {
        const questTitle = `Quest ${Date.now()}`;
        const questDescription = `Quest description ${Date.now()}`;
        const dialogueNodeId = `start-${Date.now()}`;

        await page.getByLabel(/^Title/i).fill(questTitle);
        await page.getByLabel(/^Description/i).fill(questDescription);
        await page
            .getByLabel(/^Upload an Image/i)
            .setInputFiles({ name: 'quest-e2e.png', mimeType: 'image/png', buffer: SAMPLE_IMAGE_BYTES });
        await page.getByLabel(/^NPC Identifier/i).fill('/assets/npc/dChat.jpg');

        await page.getByLabel(/^New node ID/i).fill(dialogueNodeId);
        await page.getByLabel(/^Node text/i).fill('Automated quest greeting');
        await page.getByRole('button', { name: /^Add Dialogue Node$/i }).click();

        await page.getByLabel(/^Start node/i).selectOption(dialogueNodeId);
        await page.getByLabel(/^New option text/i).fill('Wrap up quest');
        await page.getByLabel(/^Type$/i).selectOption('finish');
        await page.getByRole('button', { name: /^Add Option$/i }).click();

        await page.getByRole('button', { name: /^Create Quest$/i }).click();
        await expect(page.getByRole('status')).toContainText('Quest created successfully');

        await waitForQuestRecordByTitle(page, questTitle);

        await Promise.all([
            page.waitForURL(/\/quests\/[^/]+$/),
            page.getByRole('link', { name: /view quest/i }).click(),
        ]);
        await expect(
            page.getByRole('heading', {
                level: 1,
                name: new RegExp(`^${escapeRegExp(questTitle)}$`, 'i'),
            })
        ).toBeVisible();

        await page.goto('/quests', { waitUntil: 'domcontentloaded' });
        const questLink = page.getByRole('link', {
            name: new RegExp(`^${escapeRegExp(questTitle)}$`, 'i'),
        });
        await expect.poll(async () => questLink.isVisible(), { timeout: 15_000 }).toBe(true);
    });
});
