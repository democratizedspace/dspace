import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { purgeClientState, waitForHydration, waitForQuestRecordByTitle } from './test-helpers';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function createTestPngBuffer(page: Page) {
    const dataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas context unavailable');
        }
        context.fillStyle = '#38bdf8';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#f97316';
        context.fillRect(4, 4, 24, 24);
        return canvas.toDataURL('image/png');
    });
    const base64Payload = dataUrl.split(',')[1] ?? '';
    return Buffer.from(base64Payload, 'base64');
}

test.describe('Quest creation flow', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('creates a custom quest that appears in the quests list', async ({ page }) => {
        const questTitle = `E2E Quest ${Date.now()}`;
        const questDescription = 'Automated quest used to verify custom quest persistence.';

        await page.goto('/quests/create');
        await waitForHydration(page);

        await page.getByLabel('Title*').fill(questTitle);
        await page
            .getByLabel('Description*')
            .fill(`${questDescription} Ensures stability during CI runs.`);
        await page.getByLabel('NPC Identifier*').fill('/assets/npc/dChat.jpg');

        const fileInput = page.getByTestId('image-file-input');
        const buffer = await createTestPngBuffer(page);
        await fileInput.setInputFiles({
            name: 'quest-e2e.png',
            mimeType: 'image/png',
            buffer,
        });
        const previewImage = page.getByRole('img', { name: 'Quest preview' });
        await expect(previewImage).toHaveAttribute('src', /^data:image\/jpeg;base64,/);

        await page.getByLabel('New node ID').fill('start');
        await page.getByLabel('Node text').fill('Welcome to the automated quest!');
        await page.getByRole('button', { name: 'Add Dialogue Node' }).click();

        const nodeSection = page
            .locator('section.dialogue-node')
            .filter({ has: page.getByRole('heading', { level: 3, name: /^start$/i }) })
            .first();
        await expect(nodeSection).toBeVisible();

        await nodeSection.getByLabel('New option text').fill('Complete mission');
        await nodeSection.locator('#option-type-start').selectOption('finish');
        await nodeSection.getByRole('button', { name: 'Add Option' }).click();
        await expect(nodeSection.locator('.option-row')).toHaveCount(1);

        await page.getByLabel(/Start node/i).selectOption('start');

        await page.getByRole('button', { name: /^Create Quest$/ }).click();

        const successBanner = page.getByRole('status');
        await expect(successBanner).toBeVisible();
        await expect(successBanner).toContainText('Quest created successfully');
        await expect(successBanner.getByRole('link', { name: /View quest/i })).toBeVisible();

        await waitForQuestRecordByTitle(page, questTitle);

        await page.goto('/quests');
        await page.waitForURL(/\/quests\/?$/);
        await waitForHydration(page);

        const questLink = page.getByRole('link', {
            name: new RegExp(`^${escapeRegExp(questTitle)}$`, 'i'),
        });
        await expect(questLink).toBeVisible();
        await expect(questLink).toHaveAttribute('aria-label', questTitle);
        await expect(questLink.locator('img').first()).toHaveAttribute(
            'alt',
            new RegExp(escapeRegExp(questTitle), 'i')
        );
    });
});
