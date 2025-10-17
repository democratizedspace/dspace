import { test, expect } from '@playwright/test';
import { npcPersonas } from '../src/data/npcPersonas.js';
import { waitForHydration } from './test-helpers';

const personaExpectations = npcPersonas.map((persona) => ({
    id: persona.id,
    name: persona.name,
    summary: persona.summary,
    welcomeText: persona.welcomeMessage ?? persona.welcomeSnippet ?? '',
}));

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
        localStorage.clear();

        if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
            try {
                const dbs = await indexedDB.databases();
                for (const db of dbs) {
                    if (db && db.name) {
                        indexedDB.deleteDatabase(db.name);
                    }
                }
            } catch (error) {
                console.warn('Failed to enumerate IndexedDB databases', error);
            }
        }
    });
});

test.describe('Chat NPC persona switching', () => {
    test('shows persona-specific summaries and welcome prompts', async ({ page }) => {
        await page.goto('/chat');
        await page.waitForLoadState('networkidle');
        await waitForHydration(
            page,
            '[data-testid="chat-panel"][data-provider="openai"][data-hydrated="true"]'
        );

        const openAIChatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        await expect(openAIChatPanel).toBeVisible();
        await expect(openAIChatPanel).toHaveAttribute('data-hydrated', 'true');

        const personaSelect = openAIChatPanel.locator('#chat-persona');
        const personaSummary = openAIChatPanel.locator('.persona-summary');
        const personaAvatar = openAIChatPanel.locator('.persona-selector img');

        for (const persona of personaExpectations) {
            const currentValue = await personaSelect.evaluate((select) => select.value);
            if (currentValue !== persona.id) {
                await personaSelect.selectOption(persona.id);
            }

            await expect(personaSelect).toHaveValue(persona.id);
            await expect(personaSummary).toHaveText(persona.summary);
            await expect(personaAvatar).toHaveAttribute('alt', `${persona.name} portrait`);

            const assistantMessages = openAIChatPanel.locator('.assistant');
            await expect(assistantMessages).toHaveCount(1);
            await expect(assistantMessages.first()).toContainText(persona.welcomeText);
        }
    });
});
