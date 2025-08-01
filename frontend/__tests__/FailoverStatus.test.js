/** @jest-environment jsdom */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as svelte from 'svelte/compiler';
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
});
