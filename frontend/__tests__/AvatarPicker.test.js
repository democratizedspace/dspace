/** @jest-environment jsdom */
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
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
});
