/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import OpenAIAPIKeySettings from '../src/pages/chat/svelte/OpenAIAPIKeySettings.svelte';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        openAI: { apiKey: '' },
        inventory: { '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6': 3 },
    })),
    saveGameState: vi.fn(),
    ready: Promise.resolve(),
}));

describe('OpenAIAPIKeySettings', () => {
    it('mentions the built-in knowledge base used for chat responses', async () => {
        const { findByText } = render(OpenAIAPIKeySettings);
        const info = await findByText((content) =>
            content.includes(
                'curated knowledge base covering quest lore, items, and highlights from your local inventory'
            )
        );
        expect(info).toBeInTheDocument();
    });
});
