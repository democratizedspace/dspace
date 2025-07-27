/** @jest-environment jsdom */
import { describe, it, expect } from '@jest/globals';
const fs = require('fs');
const path = require('path');
const svelte = require('svelte/compiler');
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
});
