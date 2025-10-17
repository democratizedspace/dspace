import { test, expect } from '@playwright/test';
import { purgeClientState } from './test-helpers';

const PNG_PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAF/gL+fAnv2gAAAABJRU5ErkJggg==',
    'base64'
);

test('quest creation shows accessible success message with quest link', async ({ page }) => {
    await purgeClientState(page);

    const questTitle = `Success Quest ${Date.now()}`;

    await page.goto('/quests/create', { waitUntil: 'domcontentloaded' });

    await page.getByRole('textbox', { name: /^Title/i }).fill(questTitle);
    await page
        .getByRole('textbox', { name: /^Description/i })
        .fill('Verify the quest creation success toast renders correctly.');
    await page.getByRole('textbox', { name: /^NPC Identifier/i }).fill('npc/success-check');
    await page.getByLabel(/^Upload an Image/i).setInputFiles({
        name: 'success-image.png',
        mimeType: 'image/png',
        buffer: PNG_PIXEL,
    });

    const newNodeForm = page.locator('.dialogue-builder .new-node');
    await newNodeForm.getByLabel('New node ID').fill('start');
    await newNodeForm.getByLabel('Node text').fill('Launch celebration dialogue.');
    await newNodeForm.getByRole('button', { name: 'Add Dialogue Node' }).click();

    const optionDraft = page
        .locator('section.dialogue-node')
        .filter({ has: page.getByRole('heading', { name: /^start$/i }) })
        .locator('.option-draft');
    await optionDraft.getByLabel('New option text').fill('Finish the celebration.');
    await optionDraft.getByLabel('Type').selectOption('finish');
    await optionDraft.getByRole('button', { name: 'Add Option' }).click();

    await page.getByLabel(/^Start node/i).selectOption('start');

    await page.getByRole('button', { name: /Create Quest/i }).click();

    const successMessage = page.getByRole('status', {
        name: /Quest created successfully/i,
    });
    await expect(successMessage).toBeVisible({ timeout: 20000 });
    await expect(successMessage).toContainText('Quest created successfully');

    const questLink = successMessage.getByRole('link', { name: /View quest/i });
    await expect(questLink).toBeVisible();
    await expect(questLink).toHaveAttribute('href', /\/quests\//);
});
