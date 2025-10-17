import { test, expect } from '@playwright/test';
import { purgeClientState, waitForQuestRecordByTitle } from './test-helpers';

const PNG_PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAF/gL+fAnv2gAAAABJRU5ErkJggg==',
    'base64'
);

const SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

function escapeRegExp(text: string): string {
    return text.replace(SPECIAL_CHARS, '\\$&');
}

test.describe('Custom quest management', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('renders quest creation form controls', async ({ page }) => {
        await page.goto('/quests/create', { waitUntil: 'domcontentloaded' });

        await expect(page.getByRole('heading', { name: /Create a New Quest/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /^Title/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /^Description/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /^NPC Identifier/i })).toBeVisible();
        await expect(page.getByLabel(/^Upload an Image/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Create Quest/i })).toBeVisible();
    });

    test('creates a custom quest and lists it in the quest catalog', async ({ page }) => {
        const questTitle = `Custom Quest ${Date.now()}`;

        await page.goto('/quests/create', { waitUntil: 'domcontentloaded' });

        await page.getByRole('textbox', { name: /^Title/i }).fill(questTitle);
        await page
            .getByRole('textbox', { name: /^Description/i })
            .fill('Ensure quest persistence by creating a minimal storyline.');
        await page.getByRole('textbox', { name: /^NPC Identifier/i }).fill('npc/automated-tester');
        await page.getByLabel(/^Upload an Image/i).setInputFiles({
            name: 'quest.png',
            mimeType: 'image/png',
            buffer: PNG_PIXEL,
        });

        const newNodeForm = page.locator('.dialogue-builder .new-node');
        await newNodeForm.getByLabel('New node ID').fill('start');
        await newNodeForm.getByLabel('Node text').fill('Greetings, traveler.');
        await newNodeForm.getByRole('button', { name: 'Add Dialogue Node' }).click();

        const startNodeSection = page
            .locator('section.dialogue-node')
            .filter({ has: page.getByRole('heading', { name: /^start$/i }) });
        await expect(startNodeSection).toBeVisible();

        const optionDraft = startNodeSection.locator('.option-draft');
        await optionDraft.getByLabel('New option text').fill('Complete the mission.');
        await optionDraft.getByLabel('Type').selectOption('finish');
        await optionDraft.getByRole('button', { name: 'Add Option' }).click();

        await expect(
            startNodeSection.getByRole('textbox', { name: 'Text' }).first()
        ).toHaveValue('Complete the mission.');

        await page.getByLabel(/^Start node/i).selectOption('start');

        const submitButton = page.getByRole('button', { name: /Create Quest/i });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        const successMessage = page.getByRole('status', {
            name: /Quest created successfully/i,
        });
        await expect(successMessage).toBeVisible({ timeout: 20000 });

        const questId = await waitForQuestRecordByTitle(page, questTitle, { timeoutMs: 20000 });

        const viewQuestLink = successMessage.getByRole('link', { name: /View quest/i });
        await expect(viewQuestLink).toBeVisible();
        await viewQuestLink.click();

        await expect(page).toHaveURL(new RegExp(`/quests/${questId}\\/?$`), {
            timeout: 15000,
        });
        await expect(
            page.getByRole('heading', { name: new RegExp(`^${escapeRegExp(questTitle)}$`, 'i') })
        ).toBeVisible();

        await page.goto('/quests', { waitUntil: 'domcontentloaded' });
        await expect(
            page.getByRole('link', {
                name: new RegExp(`^${escapeRegExp(questTitle)}$`, 'i'),
            })
        ).toBeVisible();
    });
});
