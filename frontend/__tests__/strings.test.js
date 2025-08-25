const { getDurationString, getDuration } = require('../src/utils/strings.js');

describe('getDurationString', () => {
    test('includes remaining time when duration below 100', () => {
        expect(getDurationString(75.1234, '5s')).toBe('75.12% - 5s');
    });

    test('omits remaining time when duration is 100', () => {
        expect(getDurationString(100, '0s')).toBe('100.00%');
    });

    test('clamps out-of-range durations', () => {
        expect(getDurationString(-10, '3s')).toBe('0.00% - 3s');
        expect(getDurationString(150, '3s')).toBe('100.00%');
    });
});

describe('getDuration', () => {
    test('formats to two decimals with percent', () => {
        expect(getDuration(3)).toBe('3.00%');
    });

    test('clamps values to 0-100%', () => {
        expect(getDuration(-5)).toBe('0.00%');
        expect(getDuration(150)).toBe('100.00%');
    });
});
