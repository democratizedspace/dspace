import { expect, test } from '@playwright/test';
import { purgeClientState, waitForQuestRecordByTitle } from './test-helpers';

const SPECIAL_REGEX_CHARS = new Set(['\\', '^', '$', '.', '|', '?', '*', '+', '(', ')', '[', ']', '{', '}']);

function escapeRegExp(value: string): string {
    return value
        .split('')
        .map((character) => (SPECIAL_REGEX_CHARS.has(character) ? `\\${character}` : character))
        .join('');
}

test.describe('Custom quest creation', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('renders quest creation form controls', async ({ page }) => {
        await page.goto('/quests/create');
        await expect(page.locator('form.quest-form')).toBeVisible();

        const titleInput = page.getByLabel(/^Title/i);
        await expect(titleInput).toBeVisible();

        const descriptionInput = page.getByLabel(/^Description/i);
        await expect(descriptionInput).toBeVisible();

        const submitButton = page.getByRole('button', { name: /create quest/i });
        await expect(submitButton).toBeVisible();
    });

    test('persists a new quest and surfaces it in the quests list', async ({ page }) => {
        const questTitle = `Quest ${Date.now()}`;
        const questDescription = 'Automated quest creation validation';

        await page.goto('/quests/create');
        await expect(page.locator('form.quest-form')).toBeVisible();

        const titleInput = page.getByLabel(/^Title/i);
        await titleInput.fill(questTitle);

        const descriptionInput = page.getByLabel(/^Description/i);
        await descriptionInput.fill(questDescription);

        const npcInput = page.getByLabel(/^NPC Identifier/i);
        if (await npcInput.count()) {
            await npcInput.fill('npc/test-bot');
        }

        const fileInput = page.getByLabel(/^Upload an Image/i);
        if (await fileInput.count()) {
            await fileInput.setInputFiles({
                name: 'quest.png',
                mimeType: 'image/png',
                buffer: Buffer.from('quest-image'),
            });
        }

        const submitButton = page.getByRole('button', { name: /create quest/i });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        const successMessage = page.getByRole('status');
        await expect(successMessage).toBeVisible();
        await expect(successMessage).toContainText(/quest created successfully/i);

        const questId = await waitForQuestRecordByTitle(page, questTitle);
        expect(questId).toBeGreaterThan(0);

        const viewLink = successMessage.getByRole('link', { name: /view quest/i });
        await expect(viewLink).toBeVisible();
        const href = await viewLink.getAttribute('href');
        expect(href).toMatch(/\/quests\//);

        await Promise.all([
            page.waitForURL(new RegExp(`/quests/${questId}(?:/|$)`)),
            viewLink.click(),
        ]);

        await expect(page).toHaveURL(new RegExp(`/quests/${questId}(?:/|$)`));

        await page.goto('/quests');
        await expect(page).toHaveURL(/\/quests\/?$/);

        const questLink = page.getByRole('link', {
            name: new RegExp(`^${escapeRegExp(questTitle)}$`, 'i'),
        });
        await questLink.scrollIntoViewIfNeeded();
        await expect(questLink).toBeVisible();
    });
});
