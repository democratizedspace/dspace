/** @jest-environment jsdom */
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as svelte from 'svelte/compiler';
import AvatarPicker from '../src/components/svelte/AvatarPicker.svelte';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AvatarPicker component', () => {
    it('compiles without error', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/components/svelte/AvatarPicker.svelte'),
            'utf8'
        );
        expect(() => svelte.compile(source)).not.toThrow();
    });

    it('disables Select button until avatar chosen', async () => {
        const defaultPFPs = ['a.png', 'b.png'];
        const { getByRole, getAllByRole } = render(AvatarPicker, { defaultPFPs });
        const selectButton = getByRole('button', { name: 'Select' });
        expect(selectButton).toBeDisabled();
        const options = getAllByRole('button', { name: /Select avatar/i });
        await fireEvent.click(options[0]);
        expect(selectButton).not.toBeDisabled();
    });

    it('indicates selected avatar with aria-pressed', async () => {
        const defaultPFPs = ['a.png', 'b.png'];
        const { getAllByRole } = render(AvatarPicker, { defaultPFPs });
        const options = getAllByRole('button', { name: /Select avatar/i });
        expect(options[0]).toHaveAttribute('aria-pressed', 'false');
        await fireEvent.click(options[0]);
        expect(options[0]).toHaveAttribute('aria-pressed', 'true');
    });

    it('exposes hydration state for tests', async () => {
        const defaultPFPs = ['a.png'];
        const { container } = render(AvatarPicker, { defaultPFPs });
        const picker = container.querySelector('[data-testid="avatar-picker"]');

        expect(picker).toBeInTheDocument();
        expect(picker).toHaveAttribute('data-hydrated', 'false');

        await tick();

        expect(picker).toHaveAttribute('data-hydrated', 'true');
    });
});
