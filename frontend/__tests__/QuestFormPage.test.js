/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import QuestFormPage from '../src/components/svelte/QuestFormPage.svelte';

jest.mock('../src/components/svelte/QuestForm.svelte', () => ({ default: {} }));

describe('QuestFormPage component', () => {
    it('exports a valid Svelte component', () => {
        expect(typeof QuestFormPage).toBe('function');
    });
});
