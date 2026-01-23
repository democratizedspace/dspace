import { test, expect } from '@playwright/test';
import {
    createTestPngBuffer,
    purgeClientState,
    waitForHydration,
    waitForImagePreview,
    waitForQuestRecordByTitle,
} from './test-helpers';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
        await page.getByLabel('NPC Identifier*').selectOption('/assets/npc/dChat.jpg');

        const fileInput = page.getByTestId('image-file-input');
        const buffer = await createTestPngBuffer(page, {
            background: '#38bdf8',
            accent: '#f97316',
            inset: 4,
        });
        await fileInput.setInputFiles({
            name: 'quest-e2e.png',
            mimeType: 'image/png',
            buffer,
        });
        await waitForImagePreview(page, fileInput);

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
