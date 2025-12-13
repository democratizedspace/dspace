/** @jest-environment jsdom */
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import * as svelte from 'svelte/compiler';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import FailoverStatus from '../src/components/svelte/FailoverStatus.svelte';

describe('FailoverStatus Component', () => {
    it('exports a valid Svelte component', () => {
        expect(typeof FailoverStatus).toBe('function');
    });

    it('compiles without error', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/components/svelte/FailoverStatus.svelte'),
            'utf8'
        );
        expect(() => svelte.compile(source)).not.toThrow();
    });

    it('updates when going offline and back online', async () => {
        const { getByTestId } = render(FailoverStatus);
        const status = getByTestId('connection-status');

        expect(status).toHaveTextContent('Online');

        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        window.dispatchEvent(new Event('offline'));
        await tick();
        expect(status).toHaveTextContent('Offline - changes will sync when connection restores');

        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        window.dispatchEvent(new Event('online'));
        await tick();
        expect(status).toHaveTextContent('Online');
    });
});
