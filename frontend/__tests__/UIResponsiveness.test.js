/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
const fs = require('fs');
const path = require('path');
const svelte = require('svelte/compiler');
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import UIResponsiveness from '../src/components/svelte/UIResponsiveness.svelte';

describe('UIResponsiveness Component', () => {
    it('exports a valid Svelte component', () => {
        expect(typeof UIResponsiveness).toBe('function');
    });

    it('compiles without error', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/components/svelte/UIResponsiveness.svelte'),
            'utf8'
        );
        expect(() => svelte.compile(source)).not.toThrow();
    });

    it('renders hydration time', async () => {
        const spy = vi.spyOn(performance, 'now').mockReturnValue(150);
        const { getByTestId } = render(UIResponsiveness, { startTime: 100 });
        await tick();
        expect(getByTestId('hydration-time')).toHaveTextContent('Hydration time: 50 ms');
        spy.mockRestore();
    });
});
