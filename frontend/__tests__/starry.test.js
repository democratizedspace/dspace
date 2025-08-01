/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { createStarryNight } from '../src/scripts/starry.js';

describe('createStarryNight', () => {
    test('draws background and stars and listens for resize', () => {
        document.body.innerHTML = '<canvas id="sky"></canvas>';
        const canvas = document.getElementById('sky');
        const ctx = {
            beginPath: jest.fn(),
            lineTo: jest.fn(),
            closePath: jest.fn(),
            fillRect: jest.fn(),
            fill: jest.fn(),
        };
        canvas.getContext = jest.fn(() => ctx);
        Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
        const addSpy = jest.spyOn(window, 'addEventListener');

        createStarryNight('#sky');

        expect(canvas.width).toBe(800);
        expect(canvas.height).toBe(600);
        expect(ctx.fillRect).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
        expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
});
