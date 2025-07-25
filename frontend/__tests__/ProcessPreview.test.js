/**
 * @jest-environment jsdom
 */
import ProcessPreview from '../src/components/svelte/ProcessPreview.svelte';

describe('ProcessPreview component', () => {
    it('exports a valid Svelte component', () => {
        expect(typeof ProcessPreview).toBe('function');
    });
});
