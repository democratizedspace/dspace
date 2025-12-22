import { render, fireEvent } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Chip from '../Chip.svelte';

describe('Chip', () => {
    test('applies hazard styling when enabled', async () => {
        const handleClick = vi.fn();
        const { getByRole } = render(Chip, {
            props: { text: 'Danger', hazard: true, onClick: handleClick },
        });

        const button = getByRole('button', { name: 'Danger' });

        expect(button.classList.contains('hazard')).toBe(true);

        await fireEvent.click(button);
        expect(handleClick).toHaveBeenCalled();
    });
});
