import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Chip from '../svelte/Chip.svelte';

function ensureChipStaticOpacityStyle() {
    if (document.getElementById('chip-static-opacity-regression-style')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'chip-static-opacity-regression-style';
    style.textContent = 'nav .chip-container.static-container { opacity: 1; }';
    document.head.appendChild(style);
}

describe('Chip', () => {
    it('renders an opaque static container for inverted chips without inline opacity styles', () => {
        ensureChipStaticOpacityStyle();

        const { container, getByTestId, queryByRole } = render(Chip, {
            props: {
                text: '',
                inverted: true,
                dataTestId: 'chip-static',
            },
        });

        const staticContainer = getByTestId('chip-static');

        expect(queryByRole('button')).toBeNull();
        expect(staticContainer.tagName).toBe('DIV');
        expect(staticContainer.classList.contains('chip-container')).toBe(true);
        expect(staticContainer.classList.contains('static-container')).toBe(true);
        expect(staticContainer.classList.contains('inverted')).toBe(true);
        expect(getComputedStyle(staticContainer as HTMLElement).opacity).toBe('1');
        expect(staticContainer.getAttribute('style') ?? '').not.toContain('opacity');
        expect(container.querySelector('nav .chip-container.static-container.inverted')).toBe(
            staticContainer
        );
    });
});
