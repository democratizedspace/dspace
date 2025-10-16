import { test, expect } from '@playwright/test';
import { waitForHydration } from './test-helpers';

const personaExpectations = [
    {
        id: 'dchat',
        name: 'dChat',
        summary: 'Generalist assistant with a full game knowledge base.',
        welcomeSnippet: "I'm dChat!",
    },
    {
        id: 'sydney',
        name: 'Sydney',
        summary: 'Print farm lead and 3D printing mentor.',
        welcomeSnippet: 'Sydney here—FDM rigs are my playground.',
    },
    {
        id: 'nova',
        name: 'Nova',
        summary: 'Rocketeer with launch-ready checklists.',
        welcomeSnippet: "I'm Nova—ready to prep another launch?",
    },
    {
        id: 'hydro',
        name: 'Hydro',
        summary: 'Hydroponics caretaker focused on nutrient balance.',
        welcomeSnippet: "I'm Hydro—let's keep those nutrient baths dialed in.",
    },
];

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

            const expectedWelcome = persona.welcomeMessage ?? persona.welcomeSnippet;
            const matchingAssistantMessage = openAIChatPanel
                .locator('.assistant')
                .filter({ hasText: expectedWelcome });

            await expect(matchingAssistantMessage).toBeVisible({ timeout: 15000 });
        }
    });
});
