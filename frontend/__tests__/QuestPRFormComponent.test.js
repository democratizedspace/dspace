/**
 * @jest-environment jsdom
 */
import QuestPRForm from '../src/components/svelte/QuestPRForm.svelte';

describe('QuestPRForm component', () => {
    it('exports a valid Svelte component', () => {
        expect(typeof QuestPRForm).toBe('function');
    });
});
