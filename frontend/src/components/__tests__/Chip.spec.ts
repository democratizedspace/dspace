import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Chip from '../svelte/Chip.svelte';

describe('Chip', () => {
    it('keeps static inverted chips fully opaque while remaining selectable', () => {
        const { container } = render(Chip, {
            props: {
                inverted: true,
            },
        });

        const staticContainer = container.querySelector('.chip-container');

        expect(staticContainer).not.toBeNull();
        expect(staticContainer?.classList.contains('inverted')).toBe(true);
        expect(staticContainer?.classList.contains('selectable-static')).toBe(true);
        expect(staticContainer?.classList.contains('high-contrast')).toBe(true);
    });
});
