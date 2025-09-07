import { describe, it, expect, jest } from 'vitest';
import { writable } from 'svelte/store';

let resolveReady;
const state = writable({});
jest.mock('../src/utils/gameState/common.js', () => {
    const ready = new Promise((res) => {
        resolveReady = res;
    });
    return {
        exportGameStateString: jest.fn(() => 'eyJ0ZXN0IjoxfQ=='),
        state,
        ready,
    };
});

import Exporter from '../src/pages/gamesaves/svelte/Exporter.svelte';

describe('Exporter', () => {
    it('renders game state string after initialization', async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);

        new Exporter({ target: container });

        expect(container.innerHTML).toBe('');

        resolveReady();
        await new Promise((r) => setTimeout(r, 0));

        const code = container.querySelector('code');
        expect(code.textContent).toBe('eyJ0ZXN0IjoxfQ==');

        document.body.removeChild(container);
    });
});
