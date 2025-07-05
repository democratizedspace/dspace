/**
 * @jest-environment jsdom
 */
import AvatarPicker from '../src/components/svelte/AvatarPicker.svelte';
import '@testing-library/jest-dom';

describe('AvatarPicker component', () => {
    let container;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    test('exports a valid Svelte component', () => {
        expect(typeof AvatarPicker).toBe('function');
    });

    test('module exports a Svelte component', () => {
        expect(typeof AvatarPicker).toBe('function');
    });
});
