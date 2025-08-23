/** @jest-environment jsdom */
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import Chip from '../src/components/svelte/Chip.svelte';

describe('Chip accessibility', () => {
    it('exposes disabled state', () => {
        const { getByRole } = render(Chip, {
            text: 'Example',
            onClick: () => {},
            disabled: true,
        });
        const button = getByRole('button', { name: 'Example' });
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).toBeDisabled();
    });
});
