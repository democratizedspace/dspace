/**
 * @jest-environment jsdom
 */
import QuestReview from '../src/components/svelte/QuestReview.svelte';

describe('QuestReview component', () => {
    it('exports a valid Svelte component', () => {
        expect(typeof QuestReview).toBe('function');
    });
});
