import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Chip from '../svelte/Chip.svelte';

describe('Chip', () => {
    it('exposes disabled state for buttons', () => {
        const { getByRole } = render(Chip, {
            text: 'Example',
            onClick: () => {},
            disabled: true,
        });

        const button = getByRole('button', { name: 'Example' });
        expect(button.getAttribute('aria-disabled')).toBe('true');
        expect((button as HTMLButtonElement).disabled).toBe(true);
    });

    it('keeps selectable static containers visibly inverted', () => {
        const { container } = render(Chip, {
            text: '',
            inverted: true,
        });

        expect(container.querySelector('nav .chip-container.inverted')).not.toBeNull();
        expect(container.querySelector('nav button')).toBeNull();
    });
});
