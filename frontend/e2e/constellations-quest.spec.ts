import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { clearUserData } from './test-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questPath = path.resolve(__dirname, '../test-data/constellations-quest.json');
const questTemplate = JSON.parse(fs.readFileSync(questPath, 'utf8'));

/**
 * End-to-end creation of the constellations quest using the in-game UI.
 * After creation, the quest JSON is patched with the full example and
 * validated with the quest simulation helper.
 */

test.describe('Constellations Quest Creation', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('create and validate constellations quest', async ({ page }) => {
        // Step 1: create the quest via the UI
        await page.goto('/quests/create');
        await page.waitForLoadState('networkidle');

        await page.fill('#title', questTemplate.title);
        await page.fill('#description', questTemplate.description);

        const imageInput = page.locator('input[type="file"]');
        if ((await imageInput.count()) > 0) {
            await imageInput.setInputFiles(path.resolve(__dirname, '../test-data/test-image.jpg'));
        }

        await page.click('button.submit-button');
        await page.waitForLoadState('networkidle');

        // Step 2: find the created quest id in IndexedDB
        const questId: number = await page.evaluate(async (title) => {
            const mod = await import('/src/utils/customcontent.js');
            const quests = await mod.db.list(mod.ENTITY_TYPES.QUEST);
            const match = quests.find((q: { title: string; id: number }) => q.title === title);
            return match ? match.id : -1;
        }, questTemplate.title);

        expect(questId).toBeGreaterThan(0);

        // Step 3: patch quest with full JSON
        await page.evaluate(
            async (id, quest) => {
                const mod = await import('/src/utils/customcontent.js');
                quest.id = id;
                await mod.updateQuest(id, quest);
            },
            questId,
            questTemplate
        );

        // Retrieve quest back from IndexedDB
        const storedQuest = await page.evaluate(async (id) => {
            const mod = await import('/src/utils/customcontent.js');
            return mod.getQuest(id);
        }, questId);

        // Validate with questHasFinishPath helper
        const { questHasFinishPath } = await import('../src/utils/simulateQuest.js');
        expect(questHasFinishPath(storedQuest)).toBe(true);

        // Verify it appears in quests list
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text="${questTemplate.title}"`)).toBeVisible();
    });
});
