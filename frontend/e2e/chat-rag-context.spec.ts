import { expect, test } from '@playwright/test';

const INVENTORY_ITEM_ID = '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6';
const QUEST_ID = 'welcome/howtodoquests';
const PROCESS_ID = 'outlet-dWatt-1e3';

test.describe('chat RAG context', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(
            ({ questId, processId, inventoryId }) => {
                const now = Date.now();
                const gameState = {
                    _meta: { lastUpdated: now },
                    inventory: { [inventoryId]: 2 },
                    quests: {
                        [questId]: { stepId: 2 },
                        'welcome/intro-inventory': { finished: true },
                    },
                    processes: {
                        [processId]: {
                            startedAt: now - 15000,
                            duration: 30000,
                            elapsedBeforePause: 0,
                        },
                    },
                };

                localStorage.setItem('gameState', JSON.stringify(gameState));
                Object.defineProperty(window, 'indexedDB', {
                    value: undefined,
                    configurable: true,
                });

                const payloads = [];
                // @ts-expect-error test hook
                window.__DSpaceCapturedPayloads = payloads;
                // @ts-expect-error test hook
                window.__DSpaceOpenAIClient = function () {
                    return {
                        responses: {
                            create: async (payload) => {
                                payloads.push(payload);
                                await new Promise((resolve) => setTimeout(resolve, 75));
                                return { output_text: 'stubbed reply' };
                            },
                        },
                    };
                };
            },
            { questId: QUEST_ID, processId: PROCESS_ID, inventoryId: INVENTORY_ITEM_ID }
        );
    });

    test('sends persona prompt with live quest, process, and inventory context', async ({
        page,
    }) => {
        await page.goto('/chat');

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        await expect(chatPanel).toBeVisible();

        // Wait for the component to be hydrated
        await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');

        const personaSelector = chatPanel.getByLabel('Talk to');
        await personaSelector.selectOption('hydro');
        // Wait for the persona summary to update, confirming the switch is complete
        await expect(chatPanel.locator('.persona-summary')).toHaveText(
            'Hydroponics caretaker focused on nutrient balance.'
        );

        await chatPanel.getByRole('textbox').fill('How am I progressing?');
        await chatPanel.getByRole('button', { name: 'Send' }).click();
        await expect(chatPanel.locator('.spinner-container')).toBeVisible();

        const payloadHandle = await page.waitForFunction(() => {
            // @ts-expect-error test hook
            const payloads = window.__DSpaceCapturedPayloads;
            return payloads?.at(-1) ?? null;
        });

        const payload = (await payloadHandle.jsonValue()) as {
            input: Array<{ content?: Array<{ text?: string }> }>;
        };
        const messageTexts = (payload.input || [])
            .map((entry) => entry.content?.[0]?.text || '')
            .join(' ');

        expect(messageTexts).toContain('Hydro');
        expect(messageTexts).toContain('Inventory highlights');
        expect(messageTexts).toContain('white PLA filament');
        expect(messageTexts).toContain('Quest progress');
        expect(messageTexts).toContain('welcome/howtodoquests');
        expect(messageTexts).toContain('Processes in flight');
        expect(messageTexts).toContain('Buy 1 kWh of electricity from a wall outlet');

        await expect(chatPanel.locator('.spinner-container')).not.toBeVisible();
        await expect(chatPanel.getByText('stubbed reply')).toBeVisible();
    });
});
