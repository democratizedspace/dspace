/**
 * @jest-environment jsdom
 */
import QuestPreview from '../src/components/svelte/QuestPreview.svelte';

describe('QuestPreview component', () => {
    it('exports a valid Svelte component', () => {
        expect(typeof QuestPreview).toBe('function');
    });
});
