/**
 * @jest-environment node
 */
const { durationInSeconds } = require('../src/utils.js');

describe('durationInSeconds', () => {
    test('parses integer duration', () => {
        expect(durationInSeconds('1h 30m')).toBe(5400);
    });

    test('parses fractional duration', () => {
        expect(durationInSeconds('0.5h')).toBe(1800);
    });
});
