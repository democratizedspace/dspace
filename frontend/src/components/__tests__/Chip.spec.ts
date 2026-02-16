import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import Chip from '../svelte/Chip.svelte';

describe('Chip', () => {
    it('exposes disabled state for interactive chips', () => {
        const { getByRole } = render(Chip, {
            text: 'Example',
            onClick: () => {},
            disabled: true,
        });

        const button = getByRole('button', { name: 'Example' });
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).toBeDisabled();
    });

    it('keeps static containers fully opaque for readable contrast', () => {
        const { container } = render(Chip, {
            text: '',
            inverted: true,
        });

        const staticContainer = container.querySelector(
            '.chip-container.static-container.inverted'
        );
        expect(staticContainer).not.toBeNull();
        expect(staticContainer).toHaveAttribute('style', 'opacity: 1');
        expect(container.querySelector('button')).toBeNull();
    });
});
