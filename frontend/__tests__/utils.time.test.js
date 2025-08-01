import { jest } from '@jest/globals';
const {
    msToTime,
    formatNumber,
    formatNumberK,
    getRelativeTimeString,
    getElapsedTime,
    getTimeLeft,
} = require('../src/utils.js');

describe('time formatting utilities', () => {
    test('msToTime formats milliseconds', () => {
        expect(msToTime(3723000)).toBe('1h 2m 3s');
        expect(msToTime(1234)).toBe('1s 234ms');
    });

    test('formatNumber formats with commas', () => {
        expect(formatNumber(1234)).toBe('1,234');
    });

    test('formatNumberK shortens numbers', () => {
        expect(formatNumberK(500)).toBe(500);
        expect(formatNumberK(2500)).toBe('2.5K');
        expect(formatNumberK(2500000)).toBe('2.5M');
    });

    test('getRelativeTimeString handles past and future', () => {
        jest.useFakeTimers();
        const now = new Date('2023-01-01T00:00:00Z');
        jest.setSystemTime(now);
        const future = new Date('2023-01-02T00:00:00Z');
        const past = new Date('2022-12-31T00:00:00Z');
        const futureStr = getRelativeTimeString(future);
        const pastStr = getRelativeTimeString(past);
        expect(futureStr === 'tomorrow' || futureStr === 'in 1 day').toBe(true);
        expect(pastStr === 'yesterday' || pastStr === '1 day ago').toBe(true);
        jest.useRealTimers();
    });

    test('getElapsedTime and getTimeLeft', () => {
        jest.useFakeTimers();
        const start = new Date('2023-01-01T00:00:00Z');
        jest.setSystemTime(new Date('2023-01-01T01:00:00Z'));
        expect(getElapsedTime(start)).toBe(3600000);
        expect(getTimeLeft(start, 0, 7200000)).toBe(3600000);
        jest.useRealTimers();
    });
});
